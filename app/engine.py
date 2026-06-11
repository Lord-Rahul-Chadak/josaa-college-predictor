import pandas as pd
import numpy as np

def merge_sort_records(arr: list, key: str) -> list:
    """
    Custom Merge Sort implementation to sort a list of dictionaries 
    by a specific numeric key in Ascending Order (O(n log n) stability).
    """
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left_half = merge_sort_records(arr[:mid], key)
    right_half = merge_sort_records(arr[mid:], key)

    return merge(left_half, right_half, key)


def merge(left: list, right: list, key: str) -> list:
    """Helper merging function for the split array components."""
    sorted_list = []
    i = j = 0

    # Sort ascending: lowest numerical cutoff rank (most competitive) floats to top
    while i < len(left) and j < len(right):
        if left[i][key] <= right[j][key]:
            sorted_list.append(left[i])
            i += 1
        else:
            sorted_list.append(right[j])
            j += 1

    # Gather remaining elements
    sorted_list.extend(left[i:])
    sorted_list.extend(right[j:])
    return sorted_list


def calculate_chances(df_chunk: pd.DataFrame, target_rank: int):
    """Applies threshold multipliers over a specific data pool segment."""
    if df_chunk.empty:
        return df_chunk
        
    df_chunk['safe_val'] = df_chunk['Closing Rank'] * 0.90
    df_chunk['mod_val'] = df_chunk['Closing Rank'] * 1.05
    df_chunk['risk_val'] = df_chunk['Closing Rank'] * 1.15

    conditions = [
        (target_rank <= df_chunk['safe_val']),
        (target_rank > df_chunk['safe_val']) & (target_rank <= df_chunk['mod_val']),
        (target_rank > df_chunk['mod_val']) & (target_rank <= df_chunk['risk_val'])
    ]
    
    choices_status = ['Safe 🟢', 'Moderate 🟡', 'Risky 🔴']
    choices_prob = ['95%', '60%', '25%']

    df_chunk['Admission_Chance'] = np.select(conditions, choices_status, default='No Chance ❌')
    df_chunk['Probability_Score'] = np.select(conditions, choices_prob, default='0%')
    return df_chunk


def run_prediction_engine(df: pd.DataFrame, rank: int, category: str, gender: str, quota: str, inst_keyword: str = "", branch_keyword: str = "", advanced_rank: int = None):
    # 1. Isolate final round data points
    max_rounds = df.groupby('Year')['Round'].max().reset_index()
    final_rounds_df = pd.merge(df, max_rounds, on=['Year', 'Round'])
    
    # 2. Basic Demographic Filter
    filtered = final_rounds_df[
        (final_rounds_df['Seat Type'] == category) &
        (final_rounds_df['Gender'] == gender) &
        (final_rounds_df['Quota'] == quota)
    ]
    
    if filtered.empty:
        return []

    # 3. Separate IITs from Main-allocated options
   # 3. CRITICAL SPLIT: Separate IITs cleanly using robust keyword isolation
    is_iit_mask = filtered['Institute'].str.contains('Technology', case=False) & \
                  ~filtered['Institute'].str.contains('National', case=False) & \
                  ~filtered['Institute'].str.contains('Information', case=False)
                  
    iit_pool = filtered[is_iit_mask]
    non_iit_pool = filtered[~is_iit_mask]
    
    processed_segments = []

    if not non_iit_pool.empty:
        grouped_mains = non_iit_pool.groupby(['Institute', 'Academic Program Name'])['Closing Rank'].median().reset_index()
        grouped_mains = calculate_chances(grouped_mains, rank)
        processed_segments.append(grouped_mains)
        
    if advanced_rank is not None and advanced_rank > 0 and not iit_pool.empty:
        grouped_adv = iit_pool.groupby(['Institute', 'Academic Program Name'])['Closing Rank'].median().reset_index()
        grouped_adv = calculate_chances(grouped_adv, advanced_rank)
        processed_segments.append(grouped_adv)

    if not processed_segments:
        return []

    # Combine pools and filter text keywords
    grouped = pd.concat(processed_segments, ignore_index=True)
    if inst_keyword:
        grouped = grouped[grouped['Institute'].str.contains(inst_keyword, case=False, na=False)]
    if branch_keyword:
        grouped = grouped[grouped['Academic Program Name'].str.contains(branch_keyword, case=False, na=False)]

    final_results = grouped[grouped['Admission_Chance'] != 'No Chance ❌']

    # Convert results into a standard Python list of dicts for our Merge Sort processing
    raw_records = final_results.rename(columns={
        'Academic Program Name': 'Branch', 
        'Closing Rank': 'Median_Cutoff'
    })[['Institute', 'Branch', 'Median_Cutoff', 'Admission_Chance', 'Probability_Score']].to_dict(orient='records')

    # 4. CHOICE-FILLING HYBRID SEGMENTATION USING MERGE SORT
    iit_records = []
    nit_records = []
    iiit_records = []
    gfti_records = []

    for rec in raw_records:
        inst_lower = rec['Institute'].lower()
        if 'indian institute of technology' in inst_lower and 'information' not in inst_lower:
            iit_records.append(rec)
        elif 'national institute of technology' in inst_lower or 'nit' in inst_lower:
            nit_records.append(rec)
        elif 'indian institute of information technology' in inst_lower or 'iiit' in inst_lower:
            iiit_records.append(rec)
        else:
            gfti_records.append(rec)

    # Sort each distinct tier bucket by Median Cutoff Ascending using our custom algorithm
    sorted_iits = merge_sort_records(iit_records, 'Median_Cutoff')
    sorted_nits = merge_sort_records(nit_records, 'Median_Cutoff')
    sorted_iiits = merge_sort_records(iiit_records, 'Median_Cutoff')
    sorted_gftis = merge_sort_records(gfti_records, 'Median_Cutoff')

    # Re-assemble into the optimized preference sequence: IITs first, then NITs -> IIITs -> GFTIs
    return sorted_iits + sorted_nits + sorted_iiits + sorted_gftis