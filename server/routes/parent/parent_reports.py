from flask import Blueprint, jsonify, request, current_app
from utils.access_control import require_auth, require_role
from config.settings import get_authenticated_client
from datetime import datetime, timedelta
from utils.redis_client import get_redis_client
import json
import hashlib
from dateutil.relativedelta import relativedelta

parent_reports_bp = Blueprint('parent_reports', __name__)
redis_client = get_redis_client()

CACHE_TTL = 300  # 5 minutes

def get_cache_key(report_type, filters):
    """Generate a unique cache key based on report type and filters"""
    filter_str = json.dumps(filters, sort_keys=True)
    filter_hash = hashlib.md5(filter_str.encode()).hexdigest()
    return f"parent_report:{report_type}:{filter_hash}"

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
    Calculate WHO/CDC growth percentiles (placeholder implementation)
    """
    if not age_months or not value:
        return None

    # Placeholder calculation - replace with actual LMS method in production
    import random
    random.seed(int(value * 100))
    return round(40 + random.random() * 30, 1)

@parent_reports_bp.route('/parent/reports/children', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_children_reports():
    """
    Get all children with basic info for the parent to select from
    """
    try:
        current_user_id = request.current_user.get('id')
        supabase = get_authenticated_client()

        # Get all active children for this parent
        access_response = supabase.table('parent_access')\
            .select('patient_id, relationship, patients(patient_id, firstname, lastname, date_of_birth, sex)')\
            .eq('user_id', current_user_id)\
            .eq('is_active', True)\
            .execute()

        if not access_response.data:
            return jsonify({
                "status": "success",
                "data": {
                    "children": []
                }
            }), 200

        children_list = []
        for access_record in access_response.data:
            patient = access_record.get('patients')
            if patient:
                # Calculate age
                age_months = calculate_age_in_months(patient.get('date_of_birth'))
                age_years = age_months // 12 if age_months else 0

                children_list.append({
                    'id': patient['patient_id'],
                    'name': f"{patient.get('firstname', '')} {patient.get('lastname', '')}".strip(),
                    'age': age_years,
                    'dob': patient.get('date_of_birth'),
                    'sex': patient.get('sex'),
                    'relationship': access_record.get('relationship')
                })

        return jsonify({
            "status": "success",
            "data": {
                "children": children_list
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching parent's children: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500


@parent_reports_bp.route('/parent/reports/child/<patient_id>', methods=['GET'])
@require_auth
@require_role('parent')
def get_child_report(patient_id):
    """
    Get comprehensive report data for a specific child
    Includes: Growth data, vitals, immunizations
    """
    try:
        bust_cache = request.args.get('bust_cache', 'false').lower() == 'true'
        current_user_id = request.current_user.get('id')

        # Build cache key
        filters = {'parent_id': current_user_id, 'patient_id': patient_id}
        cache_key = get_cache_key('child_report', filters)
        cached_result = get_cached_data(cache_key, bust_cache)

        if cached_result:
            return jsonify({"status": "success", **cached_result}), 200

        supabase = get_authenticated_client()

        # ===================================================================
        # STEP 1: VERIFY PARENT ACCESS
        # ===================================================================

        # Verify parent has access to this child
        access_check = supabase.table('parent_access')\
            .select('access_id')\
            .eq('user_id', current_user_id)\
            .eq('patient_id', patient_id)\
            .eq('is_active', True)\
            .execute()

        if not access_check.data or len(access_check.data) == 0:
            return jsonify({
                "status": "error",
                "message": "Access denied to this patient's records"
            }), 403

        # ===================================================================
        # STEP 2: GET PATIENT INFO
        # ===================================================================

        patient_response = supabase.table('patients')\
            .select('patient_id, firstname, lastname, date_of_birth, sex, bloodtype')\
            .eq('patient_id', patient_id)\
            .execute()

        if not patient_response.data or len(patient_response.data) == 0:
            return jsonify({
                "status": "error",
                "message": "Patient not found"
            }), 404

        patient = patient_response.data[0]
        age_months = calculate_age_in_months(patient.get('date_of_birth'))
        age_years = age_months // 12 if age_months else 0

        # ===================================================================
        # STEP 3: GROWTH DATA (Anthropometric Measurements)
        # ===================================================================

        # Get last 12 measurements
        measurements_response = supabase.table('anthropometric_measurements')\
            .select('weight, height, measurement_date')\
            .eq('patient_id', patient_id)\
            .order('measurement_date', desc=True)\
            .limit(12)\
            .execute()

        measurements = measurements_response.data or []
        measurements.reverse()  # Chronological order

        growth_data = []
        latest_height = 0
        latest_weight = 0
        latest_bmi = 0
        height_percentile = 0
        weight_percentile = 0

        for measurement in measurements:
            weight = measurement.get('weight')
            height = measurement.get('height')
            bmi = calculate_bmi(weight, height)
            measurement_date = measurement.get('measurement_date', '')[:7]  # YYYY-MM

            # Calculate percentiles
            h_percentile = calculate_who_cdc_percentile(age_months, patient.get('sex', 'M'), 'height', height)
            w_percentile = calculate_who_cdc_percentile(age_months, patient.get('sex', 'M'), 'weight', weight)

            growth_data.append({
                'month': measurement_date,
                'height': round(height, 1) if height else 0,
                'weight': round(weight, 1) if weight else 0,
                'bmi': bmi if bmi else 0,
                'heightPercentile': h_percentile if h_percentile else 50,
                'weightPercentile': w_percentile if w_percentile else 50
            })

            # Keep latest values
            if height:
                latest_height = round(height, 1)
                height_percentile = h_percentile if h_percentile else 50
            if weight:
                latest_weight = round(weight, 1)
                weight_percentile = w_percentile if w_percentile else 50
            if bmi:
                latest_bmi = bmi

        # ===================================================================
        # STEP 4: VITALS DATA (currently not stored in database)
        # ===================================================================

        # NOTE: Vitals data (blood pressure, heart rate, temperature, oxygen saturation)
        # is not currently stored in the database. This section returns empty data.
        # Future: Create a vitals_signs table to store this information.

        vitals_data = []

        # ===================================================================
        # STEP 4: IMMUNIZATION DATA
        # ===================================================================

        vaccinations_response = supabase.table('vaccinations')\
            .select('vaccine_name, administered_date, next_dose_due')\
            .eq('patient_id', patient_id)\
            .order('administered_date', desc=False)\
            .execute()

        vaccinations = vaccinations_response.data or []

        immunization_data = []
        required_vaccines = ['MMR', 'POLIO', 'DPT', 'HEPATITIS B', 'VARICELLA']
        vaccines_received = set()

        for vax in vaccinations:
            vaccine_name = vax.get('vaccine_name', '').upper()
            vaccines_received.add(vaccine_name)

            immunization_data.append({
                'vaccine': vax.get('vaccine_name', 'Unknown'),
                'dueDate': vax.get('next_dose_due') or 'N/A',
                'status': 'completed',
                'date': vax.get('administered_date')
            })

        # Add pending vaccines
        for req_vaccine in required_vaccines:
            if not any(req_vaccine in vax for vax in vaccines_received):
                immunization_data.append({
                    'vaccine': req_vaccine,
                    'dueDate': 'TBD',
                    'status': 'pending',
                    'date': None
                })

        # Calculate immunization progress
        completed_vaccines = len([v for v in immunization_data if v['status'] == 'completed'])
        total_vaccines = len(immunization_data)
        immunization_progress = round((completed_vaccines / total_vaccines * 100), 1) if total_vaccines > 0 else 0

        # ===================================================================
        # STEP 5: SUMMARY METRICS
        # ===================================================================

        summary_metrics = {
            'childName': f"{patient.get('firstname', '')} {patient.get('lastname', '')}".strip(),
            'age': age_years,
            'latestHeight': latest_height,
            'latestWeight': latest_weight,
            'latestBMI': latest_bmi,
            'heightPercentile': height_percentile,
            'weightPercentile': weight_percentile,
            'immunizationProgress': immunization_progress,
            'completedVaccines': completed_vaccines,
            'totalVaccines': total_vaccines
        }

        # ===================================================================
        # FINAL RESPONSE
        # ===================================================================

        data = {
            'childInfo': {
                'id': patient['patient_id'],
                'name': f"{patient.get('firstname', '')} {patient.get('lastname', '')}".strip(),
                'age': age_years,
                'dob': patient.get('date_of_birth'),
                'sex': patient.get('sex'),
                'bloodtype': patient.get('bloodtype')
            },
            'growthData': growth_data,
            'vitalsData': vitals_data,
            'immunizationData': immunization_data,
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
        current_app.logger.error(f"Error fetching child report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }), 500
