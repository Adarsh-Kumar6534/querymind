def detect_chart(data: list[dict]) -> dict:
    if not data or len(data) == 0:
        return {"type": "none"}

    keys = list(data[0].keys())
    if len(keys) < 2:
        return {"type": "none"}

    numeric_cols = []
    text_cols = []

    for key in keys:
        sample = data[0][key]
        if isinstance(sample, (int, float)) and sample is not None:
            numeric_cols.append(key)
        else:
            text_cols.append(key)

    if not numeric_cols:
        return {"type": "none"}

    x_axis = text_cols[0] if text_cols else keys[0]
    y_axis = numeric_cols[0]
    chart_type = "bar" if len(data) <= 20 else "line"

    return {
        "type": chart_type,
        "x_axis": x_axis,
        "y_axis": y_axis,
        "all_numeric": numeric_cols,
        "all_text": text_cols
    }
