from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import get_authenticated_client
from datetime import datetime, timedelta
from utils.redis_client import get_redis_client
import json
import hashlib
from dateutil.relativedelta import relativedelta

doctor_reports_bp = Blueprint('doctor_reports', __name__)
redis_client = get_redis_client()

CACHE_TTL = 300  # 5 minutes

def get_cache_key(report_type, filters):
    """Generate a unique cache key based on report type and filters"""
    filter_str = json.dumps(filters, sort_keys=True)
    filter_hash = hashlib.md5(filter_str.encode()).hexdigest()
    return f"doctor_report:{report_type}:{filter_hash}"

def get_cached_data(cache_key, bust_cache=False):
    """Get cached data if available and not busting cache"""
    if bust_cache:
        return None

    cached = redis_client.get(cache_key)
    if cached:
        try:
            cached_data = json.loads(cached)
            ttl = redis_client.ttl(cache_key)
            return {
                "data": cached_data,
                "cached": True,
                "cache_expires_in": ttl if ttl > 0 else 0
            }
        except Exception as e:
            current_app.logger.error(f"Error parsing cached data: {str(e)}")
    return None

def set_cache_data(cache_key, data):
    """Cache data with TTL"""
    try:
        redis_client.setex(cache_key, CACHE_TTL, json.dumps(data))
    except Exception as e:
        current_app.logger.error(f"Error caching data: {str(e)}")

def calculate_age_in_months(dob_str):
    """Calculate age in months from date of birth string"""
    try:
        dob = datetime.strptime(dob_str, '%Y-%m-%d')
        today = datetime.now()
        age_delta = relativedelta(today, dob)
        return age_delta.years * 12 + age_delta.months
    except:
        return None

def calculate_bmi(weight_kg, height_cm):
    """Calculate BMI from weight (kg) and height (cm)"""
    try:
        if not weight_kg or not height_cm or height_cm == 0:
            return None
        height_m = height_cm / 100
        return round(weight_kg / (height_m ** 2), 1)
    except:
        return None

def calculate_who_cdc_percentile(age_months, sex, measurement_type, value):
    """
    Calculate WHO/CDC growth percentiles

    Args:
        age_months: Age in months
        sex: 'M' or 'F'
        measurement_type: 'height', 'weight', or 'bmi'
        value: Measurement value

    Returns:
        Percentile (0-100) or None if cannot calculate
    """
    # TODO: Implement actual WHO/CDC percentile calculation using LMS method
    # For now, return a placeholder percentile based on normal distribution
    # This should be replaced with actual WHO/CDC growth chart data

    # Placeholder logic - returns percentiles in normal range (30-80)
    # In production, this should use actual WHO growth charts (0-5 years)
    # and CDC growth charts (5-20 years)

    if not age_months or not value:
        return None

    # Placeholder calculation - replace with actual LMS method
    # LMS method uses: Percentile = 100 * CDF((value/M)^L - 1) / (L*S))
    # where L, M, S are age/sex-specific parameters from WHO/CDC tables

    import random
    random.seed(int(value * 100))  # Deterministic based on value
    return round(40 + random.random() * 30, 1)  # Returns 40-70 percentile range

@doctor_reports_bp.route('/doctor/reports/all', methods=['GET'])
@require_auth
@require_role('doctor')
def get_doctor_reports():
    """
    Consolidated endpoint - returns all doctor report data in a single optimized request
    Includes: Patient growth data, immunizations, appointments, record updates
    """
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        current_user_id = request.current_user.get('id')

        # Build cache key
        filters = {'doctor_id': current_user_id}
        cache_key = get_cache_key('all_reports', filters)
        cached_result = get_cached_data(cache_key, bust_cache)

        if cached_result:
            return jsonify({"status": "success", **cached_result}), 200

        supabase = get_authenticated_client()

        # ===================================================================
        # STEP 1: FACILITY ISOLATION - Get doctor's facility and patients
        # ===================================================================

        # Get doctor's facility
        facility_response = supabase.table('facility_users')\
            .select('facility_id')\
            .eq('user_id', current_user_id)\
            .is_('end_date', 'null')\
            .execute()

        if not facility_response.data or len(facility_response.data) == 0:
            return jsonify({
                "status": "error",
                "message": "Doctor not assigned to any facility"
            }), 400

        facility_id = facility_response.data[0]['facility_id']

        # Get accessible patients for this facility
        facility_patients_response = supabase.table('facility_patients')\
            .select('patient_id')\
            .eq('facility_id', facility_id)\
            .eq('is_active', True)\
            .execute()

        patient_ids = [p['patient_id'] for p in facility_patients_response.data] if facility_patients_response.data else []

        if not patient_ids:
            # No patients, return empty data structure
            empty_data = {
                'patientGrowthData': [],
                'patientImmunizationData': [],
                'appointmentRateData': [],
                'recordUpdateFrequencyData': [],
                'growthTrendData': [],
                'immunizationDistribution': [],
                'summaryMetrics': {
                    'totalPatients': 0,
                    'totalAppointments': 0,
                    'avgCompletionRate': 0,
                    'recordsUpdatedToday': 0,
                    'avgUpdateFrequency': 0,
                    'fullyImmunizedCount': 0
                }
            }
            set_cache_data(cache_key, empty_data)
            return jsonify({"status": "success", "data": empty_data, "cached": False, "cache_expires_in": CACHE_TTL}), 200

        # ===================================================================
        # STEP 2: PATIENT GROWTH DATA
        # ===================================================================

        # Get patients with their latest anthropometric measurements
        patients_response = supabase.table('patients')\
            .select('patient_id, firstname, lastname, date_of_birth, sex')\
            .in_('patient_id', patient_ids)\
            .execute()

        patients = patients_response.data or []
        patient_growth_data = []

        for patient in patients:
            patient_id = patient['patient_id']

            # Get latest anthropometric measurement
            measurements_response = supabase.table('anthropometric_measurements')\
                .select('weight, height, measurement_date')\
                .eq('patient_id', patient_id)\
                .order('measurement_date', desc=True)\
                .limit(1)\
                .execute()

            if measurements_response.data and len(measurements_response.data) > 0:
                measurement = measurements_response.data[0]
                age_months = calculate_age_in_months(patient.get('date_of_birth'))
                age_years = age_months // 12 if age_months else 0

                weight = measurement.get('weight')
                height = measurement.get('height')
                bmi = calculate_bmi(weight, height)
                sex = patient.get('sex', 'M')

                # Calculate percentiles
                growth_percentile = calculate_who_cdc_percentile(age_months, sex, 'height', height)

                patient_growth_data.append({
                    'patient': f"{patient.get('firstname', '')} {patient.get('lastname', '')}".strip(),
                    'patient_id': patient_id,
                    'age': age_years,
                    'height': round(height, 1) if height else 0,
                    'weight': round(weight, 1) if weight else 0,
                    'bmi': bmi if bmi else 0,
                    'growthPercentile': growth_percentile if growth_percentile else 50
                })

        # ===================================================================
        # STEP 3: IMMUNIZATION DATA
        # ===================================================================

        # Get all vaccinations for facility patients
        vaccinations_response = supabase.table('vaccinations')\
            .select('patient_id, vaccine_name, administered_date, is_deleted')\
            .in_('patient_id', patient_ids)\
            .eq('is_deleted', False)\
            .execute()

        vaccinations = vaccinations_response.data or []

        # Group vaccinations by patient
        patient_vaccinations = {}
        for vax in vaccinations:
            pid = vax['patient_id']
            if pid not in patient_vaccinations:
                patient_vaccinations[pid] = []
            patient_vaccinations[pid].append(vax.get('vaccine_name', '').upper())

        # Required vaccines for full immunization
        required_vaccines = ['MMR', 'POLIO', 'DPT', 'HEPATITIS B']

        patient_immunization_data = []
        immunization_counts = {'Fully Immunized': 0, 'Partially Immunized': 0, 'Not Immunized': 0}

        for patient in patients:
            pid = patient['patient_id']
            patient_vax = patient_vaccinations.get(pid, [])

            # Count how many required vaccines the patient has
            vaccines_received = sum(1 for req_vax in required_vaccines if any(req_vax in vax for vax in patient_vax))

            if vaccines_received == len(required_vaccines):
                status = 'Fully Immunized'
            elif vaccines_received > 0:
                status = 'Partially Immunized'
            else:
                status = 'Not Immunized'

            immunization_counts[status] += 1

            patient_immunization_data.append({
                'patient': f"{patient.get('firstname', '')} {patient.get('lastname', '')}".strip(),
                'patient_id': pid,
                'mmr': 'Yes' if any('MMR' in vax for vax in patient_vax) else 'No',
                'polio': 'Yes' if any('POLIO' in vax for vax in patient_vax) else 'No',
                'dpt': 'Yes' if any('DPT' in vax for vax in patient_vax) else 'No',
                'hepatitisB': 'Yes' if any('HEPATITIS' in vax for vax in patient_vax) else 'No',
                'status': status
            })

        # Immunization distribution for pie chart
        immunization_distribution = [
            {'name': 'Fully Immunized', 'value': immunization_counts['Fully Immunized'], 'color': '#10B981'},
            {'name': 'Partially Immunized', 'value': immunization_counts['Partially Immunized'], 'color': '#F59E0B'},
            {'name': 'Not Immunized', 'value': immunization_counts['Not Immunized'], 'color': '#EF4444'}
        ]

        # ===================================================================
        # STEP 4: APPOINTMENT ANALYTICS
        # ===================================================================

        # Get all appointments for this facility
        appointments_response = supabase.table('appointments')\
            .select('appointment_id, appointment_date, status')\
            .eq('facility_id', facility_id)\
            .execute()

        appointments = appointments_response.data or []

        # Group by date
        appointment_by_date = {}
        for apt in appointments:
            date = apt.get('appointment_date', '')[:10]  # Extract YYYY-MM-DD
            status = apt.get('status', 'scheduled')

            if date not in appointment_by_date:
                appointment_by_date[date] = {
                    'date': date,
                    'scheduled': 0,
                    'completed': 0,
                    'cancelled': 0,
                    'noshow': 0
                }

            if status == 'completed':
                appointment_by_date[date]['completed'] += 1
            elif status == 'cancelled':
                appointment_by_date[date]['cancelled'] += 1
            elif status == 'no_show':
                appointment_by_date[date]['noshow'] += 1

            # Count all non-cancelled as scheduled
            if status != 'cancelled':
                appointment_by_date[date]['scheduled'] += 1

        # Calculate completion rates
        appointment_rate_data = []
        for date, data in sorted(appointment_by_date.items()):
            total_non_cancelled = data['scheduled']
            completed = data['completed']
            rate = round((completed / total_non_cancelled * 100), 2) if total_non_cancelled > 0 else 0

            appointment_rate_data.append({
                **data,
                'rate': rate
            })

        # Sort by date and take last 30 days
        appointment_rate_data.sort(key=lambda x: x['date'], reverse=True)
        appointment_rate_data = appointment_rate_data[:30]
        appointment_rate_data.reverse()  # Chronological order

        # ===================================================================
        # STEP 5: GROWTH TREND DATA (Monthly aggregation)
        # ===================================================================

        # Get measurements from last 6 months
        six_months_ago = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')

        measurements_trend_response = supabase.table('anthropometric_measurements')\
            .select('weight, height, measurement_date, patient_id')\
            .in_('patient_id', patient_ids)\
            .gte('measurement_date', six_months_ago)\
            .execute()

        measurements_trend = measurements_trend_response.data or []

        # Group by month
        monthly_data = {}
        for m in measurements_trend:
            month = m.get('measurement_date', '')[:7]  # YYYY-MM
            if month not in monthly_data:
                monthly_data[month] = {'heights': [], 'weights': [], 'bmis': []}

            height = m.get('height')
            weight = m.get('weight')
            bmi = calculate_bmi(weight, height)

            if height:
                monthly_data[month]['heights'].append(height)
            if weight:
                monthly_data[month]['weights'].append(weight)
            if bmi:
                monthly_data[month]['bmis'].append(bmi)

        growth_trend_data = []
        for month in sorted(monthly_data.keys()):
            data = monthly_data[month]
            growth_trend_data.append({
                'month': month,
                'heightPercentile': round(sum(data['heights']) / len(data['heights']), 1) if data['heights'] else 0,
                'weightPercentile': round(sum(data['weights']) / len(data['weights']), 1) if data['weights'] else 0,
                'bmiPercentile': round(sum(data['bmis']) / len(data['bmis']), 1) if data['bmis'] else 0
            })

        # ===================================================================
        # STEP 6: RECORD UPDATE FREQUENCY
        # ===================================================================

        # Get recent updates from audit logs
        today = datetime.now().strftime('%Y-%m-%d')
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        month_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        # Count updates by timeframe
        daily_updates_response = supabase.table('audit_logs')\
            .select('log_id', count='exact')\
            .eq('user_id', current_user_id)\
            .gte('action_timestamp', today)\
            .execute()

        weekly_updates_response = supabase.table('audit_logs')\
            .select('log_id', count='exact')\
            .eq('user_id', current_user_id)\
            .gte('action_timestamp', week_ago)\
            .execute()

        monthly_updates_response = supabase.table('audit_logs')\
            .select('log_id', count='exact')\
            .eq('user_id', current_user_id)\
            .gte('action_timestamp', month_ago)\
            .execute()

        daily_count = getattr(daily_updates_response, 'count', 0) or 0
        weekly_count = getattr(weekly_updates_response, 'count', 0) or 0
        monthly_count = getattr(monthly_updates_response, 'count', 0) or 0

        record_update_frequency_data = [
            {'category': 'Daily Updates', 'count': daily_count},
            {'category': 'Weekly Updates', 'count': weekly_count},
            {'category': 'Monthly Updates', 'count': monthly_count}
        ]

        # ===================================================================
        # STEP 7: SUMMARY METRICS
        # ===================================================================

        total_patients = len(patient_ids)
        total_appointments = len(appointments)

        # Calculate completion rate
        total_completed = sum(1 for apt in appointments if apt.get('status') == 'completed')
        total_non_cancelled = sum(1 for apt in appointments if apt.get('status') != 'cancelled')
        completion_rate = round((total_completed / total_non_cancelled * 100), 2) if total_non_cancelled > 0 else 0

        # Update frequency
        update_frequency = round((daily_count / total_patients * 100), 2) if total_patients > 0 else 0

        summary_metrics = {
            'totalPatients': total_patients,
            'totalAppointments': total_appointments,
            'avgCompletionRate': completion_rate,
            'recordsUpdatedToday': daily_count,
            'avgUpdateFrequency': update_frequency,
            'fullyImmunizedCount': immunization_counts['Fully Immunized']
        }

        # ===================================================================
        # FINAL RESPONSE
        # ===================================================================

        data = {
            'patientGrowthData': patient_growth_data,
            'patientImmunizationData': patient_immunization_data,
            'appointmentRateData': appointment_rate_data,
            'recordUpdateFrequencyData': record_update_frequency_data,
            'growthTrendData': growth_trend_data,
            'immunizationDistribution': immunization_distribution,
            'summaryMetrics': summary_metrics
        }

        # Cache the results
        set_cache_data(cache_key, data)

        return jsonify({
            "status": "success",
            "data": data,
            "cached": False,
            "cache_expires_in": CACHE_TTL
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching doctor reports: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500
