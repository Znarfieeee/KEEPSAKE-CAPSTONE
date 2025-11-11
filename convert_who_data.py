"""
Convert WHO Child Growth Standards from .txt files to JSON format
This script processes all WHO reference data files and creates structured JSON output
"""

import json
import re

def parse_standard_file(filename, has_lms=False):
    """
    Parse WHO data file and convert to structured JSON
    Args:
        filename: Path to the .txt file
        has_lms: Boolean indicating if file has L, M, S parameters
    Returns:
        List of dictionaries with parsed data
    """
    data = []

    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Skip header line
    for line in lines[1:]:
        # Clean the line - remove line numbers if present (e.g., "1→")
        line = re.sub(r'^\s*\d+→', '', line)
        parts = line.strip().split('\t')

        if len(parts) < 2:
            continue

        try:
            if has_lms:
                # Files with L, M, S parameters (e.g., wfa-girls-z-0-5.txt)
                if len(parts) >= 11:  # Month, L, M, S, -3SD, -2SD, -1SD, Median, 1SD, 2SD, 3SD
                    month = int(parts[0])
                    data.append({
                        'month': month,
                        'L': float(parts[1]),
                        'M': float(parts[2]),
                        'S': float(parts[3]),
                        'SD3neg': float(parts[4]),
                        'SD2neg': float(parts[5]),
                        'SD1neg': float(parts[6]),
                        'SD0': float(parts[7]),
                        'SD1': float(parts[8]),
                        'SD2': float(parts[9]),
                        'SD3': float(parts[10])
                    })
            else:
                # Files with only Z-score values
                if len(parts) >= 8:  # Month/cm, -3SD, -2SD, -1SD, Median, 1SD, 2SD, 3SD
                    key_value = float(parts[0])  # Can be month or cm (for wfh)
                    data.append({
                        'key': key_value,
                        'SD3neg': float(parts[1]),
                        'SD2neg': float(parts[2]),
                        'SD1neg': float(parts[3]),
                        'SD0': float(parts[4]),
                        'SD1': float(parts[5]),
                        'SD2': float(parts[6]),
                        'SD3': float(parts[7])
                    })
        except (ValueError, IndexError) as e:
            print(f"Skipping line in {filename}: {line.strip()} - Error: {e}")
            continue

    return data

def convert_all_who_files():
    """Convert all WHO data files to JSON"""

    # Define files to convert
    files_config = {
        'wfa': {
            'boys': ('wfa-boys-z-0-5.txt', True),  # has LMS
            'girls': ('wfa-girls-z-0-5.txt', True)  # has LMS
        },
        'lhfa': {
            'boys': ('lhfa-boys-0-5.txt', False),
            'girls': ('lhfa-girls-0-5.txt', False)
        },
        'wfh': {
            'boys': ('wfh-boys-0-5.txt', False),
            'girls': ('wfh-girls-0-5.txt', False)
        },
        'hcfa': {
            'boys': ('hcfa-boys-0-5.txt', False),
            'girls': ('hcfa-girls-0-5.txt', False)
        },
        'bfa': {
            'boys': ('bfa-boys-0-5.txt', False),
            'girls': ('bfa-girls-0-5.txt', False)
        }
    }

    all_data = {}

    for chart_type, genders in files_config.items():
        all_data[chart_type] = {}
        for gender, (filename, has_lms) in genders.items():
            print(f"Processing {filename}...")
            data = parse_standard_file(filename, has_lms)
            all_data[chart_type][gender] = data
            print(f"  - Parsed {len(data)} data points")

    # Save to JSON file
    output_file = 'client/src/data/whoReferenceData.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2)

    print(f"\n[SUCCESS] Successfully converted WHO data to {output_file}")
    print(f"  Total chart types: {len(all_data)}")
    for chart_type, genders in all_data.items():
        for gender, data in genders.items():
            print(f"  - {chart_type}/{gender}: {len(data)} data points")

if __name__ == '__main__':
    convert_all_who_files()
