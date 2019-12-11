import numpy as np
import pandas as pd

import os
from process_genres import process_genres
from process_urls import process_urls


# Helpers
def write_dataframe_as_csv(dataframe, output_filename):
    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    dataframe.to_csv(output_filename, index=False)


# Load data
print("Loading data...")

film_data = pd.read_csv("data/raw/films/F1_films+genre+sameAs.csv")
music_band_data = pd.read_csv("data/raw/musicbands/M1_musicbands+genres+sameAs.csv")
all_data = pd.concat([film_data, music_band_data]).reset_index(drop = True)


# Process data
print("Processing data...")

simplified_genres = process_genres(all_data)
enriched_urls = process_urls(all_data)

print(simplified_genres)
print(enriched_urls)


# Save data
print("Saving data...")

write_dataframe_as_csv(simplified_genres, "./data/generated/FM1-simplified-genre.csv")
write_dataframe_as_csv(enriched_urls, "./data/generated/FM1-enriched-urls.csv")
