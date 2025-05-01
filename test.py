import pandas as pd

df = pd.read_csv("cleaned_trade_data.csv", low_memory=False)

inds = df["INDICATOR"].unique()
print(len(inds), "unique INDICATOR values:")
for i in inds:
    print("•", repr(i))

fob_inds = [i for i in inds if "Free on board" in i]
print("\nFOB‐related indicators:")
for i in fob_inds:
    print("•", repr(i))

