import numpy as np
import pandas as pd
import os
import unidecode


SPLIT_LIST_RULES = {" etc": "", "\.\.\.": "", " et ": ",", " et": "", "/": ",", " - ": ",", ", ": ","}

SIMPLIFY_LIST_RULES = {"• ": "", "•": "", "'": "", "_": " ", " \(.*\)": "", "\(.*\)": ""}


#regex to add finish by " " remove, remove "(*)"

def simplify_simplified_genre(dataframe, rules):
    dataframe.replace({"simplified_genre": rules}, regex=True, inplace = True)

def split_list(dataframe):
    #simplify_simplified_genre(dataframe, SPLIT_LIST_RULES)

    columns = dataframe.columns
    new_data_drame_object = {}
    for column in columns:
        new_data_drame_object[column] = []

    for i in range(len(dataframe.index)):
        split_list = dataframe.at[i, "simplified_genre"].split(",")
        for y in split_list:
            for column in columns:
                if column != "simplified_genre":
                    new_data_drame_object[column].append(dataframe[column][i])
                else:
                    new_data_drame_object[column].append(y)
    return pd.DataFrame(new_data_drame_object)

def format_lowercase_no_accent(word):
    return unidecode.unidecode(word.lower())
#
def create_simplified_genre_column(dataframe):
    genre = [genre for genre in dataframe["genre"]]

    simplified_genre_column_name = "simplified_genre"
    simplified_genre_column = []

    is_from_url_column_name = "simplified_genre_from_URL"
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

def process_genres(dataframe, split=True, simplified=True):
    all_df = dataframe.copy()

    simplified_genre_df = create_simplified_genre_column(all_df)

    all_simplified_genre_df = all_df.join([simplified_genre_df])

    if split:
        all_simplified_genre_df = split_list(all_simplified_genre_df)

    if simplified:
        simplify_simplified_genre(all_simplified_genre_df, SIMPLIFY_LIST_RULES)
    
    return all_simplified_genre_df

films_df = pd.read_csv("data/raw/films/F1_films+genre+sameAs.csv")
bands_df = pd.read_csv("data/raw/musicbands/M1_musicbands+genres+sameAs.csv")
all_df = pd.concat([films_df, bands_df], ignore_index = True)

print(process_genres(all_df))