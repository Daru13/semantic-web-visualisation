import numpy as np
import pandas as pd
import os

SPLIT_LIST_RULES = [
    {"old": "etc", "new": ""},
    {"old": "...", "new": ""},
    {"old": " et ", "new": ","},
    {"old": " et", "new": ""},
    {"old": "/", "new": ","},
    {"old": " - ", "new": ","},
    {"old": ", ", "new": ","}
]

SIMPLIFY_LIST_RULES = [
    {"old": "• ", "new": ""},
    {"old": "•", "new": ""},
    {"old": "'", "new": ""},
    {"old": "_", "new": " "},
    {"old": "é", "new": "e"},
    {"old": "è", "new": "e"},
    {"old": "ô", "new": "o"},
    {"old": "ō", "new": "o"}
]

#regex to add finish by " " remove, remove "(*)"

def simplify_simplified_genre(dataframe, rules):
    for i in range(len(dataframe.index)):
        dataframe.at[i, "simplified genre"] = dataframe.at[i, "simplified genre"].lower()
        for rule in rules:
            dataframe.at[i, "simplified genre"] = dataframe.at[i, "simplified genre"].replace(
                rule["old"], rule["new"])

def split_list(dataframe):
    simplify_simplified_genre(dataframe, SPLIT_LIST_RULES)

    columns = dataframe.columns
    new_data_drame_object = {}
    for column in columns:
        new_data_drame_object[column] = []

    for i in range(len(dataframe.index)):
        split_list = dataframe.at[i, "simplified genre"].split(",")
        for y in split_list:
            for column in columns:
                if column != "simplified genre":
                    new_data_drame_object[column].append(dataframe[column][i])
                else:
                    new_data_drame_object[column].append(y)
    return pd.DataFrame(new_data_drame_object)

#
def create_simplified_genre_column(dataframe):
    genre = [genre for genre in dataframe["genre"]]

    simplified_genre_column_name = "simplified genre"
    simplified_genre_column = []

    is_from_url_column_name = "simplified genre from URL"
    is_from_url_column = []

    for i in range(len(genre)):
        if "resource/" in genre[i]:
            splited_url = genre[i].split("resource/")
            simplified_genre_column.append(splited_url[1])
            is_from_url_column.append("True")
        else:
            simplified_genre_column.append(genre[i])
            is_from_url_column.append("False")
    
    new_dataframe = pd.DataFrame(
        {simplified_genre_column_name: simplified_genre_column, is_from_url_column_name: is_from_url_column})

    return new_dataframe

def output_dataframe(dataframe, output_filename):
    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    dataframe.to_csv(output_filename)

films_df = pd.read_csv("data/raw/films/F3_genres.csv")
bands_df = pd.read_csv("data/raw/musicbands/M3_genres.csv")
all_df = pd.concat([films_df, bands_df], ignore_index = True)

simplified_genre_df = create_simplified_genre_column(all_df)
all_simplified_genre_df = all_df.join([simplified_genre_df])

all_simplified_genre_df = split_list(all_simplified_genre_df)
simplify_simplified_genre(all_simplified_genre_df, SIMPLIFY_LIST_RULES)

output_dataframe(all_simplified_genre_df, "./data/generated/simplified_genre.csv")
