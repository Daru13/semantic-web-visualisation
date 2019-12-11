import os

def output_dataframe(dataframe, output_filename):
    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    dataframe.to_csv(output_filename, index=False)
