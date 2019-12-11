import numpy as np
import pandas as pd

from output_dataframe_to_csv import output_dataframe
from process_genres import process_genres

film_data = pd.read_csv("data/raw/films/F1_films+genre+sameAs.csv")
music_band_data = pd.read_csv(
    "data/raw/musicbands/M1_musicbands+genres+sameAs.csv")
all_data = pd.concat([film_data, music_band_data], ignore_index=True)

simplified_genre = process_genres(all_data)
output_dataframe(simplified_genre, "./data/generated/FM1_simplified_genre.csv")