import pandas as pd

df = pd.read_csv("cleaned_trade_data.csv", low_memory=False)

COUNTRIES = ["Spain","France","Germany","Italy","Netherlands"]
FLOWS     = ["Imports of goods","Exports of goods"]
INDICATORS = [
    "Imports of goods, Cost insurance freight (CIF), US dollar",
    "Exports of goods, Free on board (FOB), US dollar"
]

subset = df[
    df.COUNTRY .isin(COUNTRIES)   &
    df.TRADE_FLOW.isin(FLOWS)     &
    df.INDICATOR.isin(INDICATORS)
]

print("Unique indicators now:", subset.INDICATOR.unique())
subset.to_csv("subset_trade_data.csv", index=False)

