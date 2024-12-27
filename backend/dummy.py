from sklearn.base import BaseEstimator, TransformerMixin


class PrepareDummyCols(BaseEstimator, TransformerMixin):
    def __init__(self, data_sep=",", col_name_sep="_"):
        self.data_sep = data_sep
        self.col_name_sep = col_name_sep

    def fit(self, X, y=None):
        object_cols = X.select_dtypes(include="object").columns
        self.dummy_cols = [
            col for col in object_cols if X[col].str.contains(self.data_sep, regex=True).any()
        ]
        self.dummy_prefix = [
            col.split(self.col_name_sep)[
                0] if self.col_name_sep in col else col[:2]
            for col in self.dummy_cols
        ]
        self.columns = self._create_dummies(X).columns
        return self

    def transform(self, X, y=None):
        X_transformed = self._create_dummies(X)
        return X_transformed.reindex(columns=self.columns, fill_value=0)

    def _create_dummies(self, X):
        X_copy = X.copy()
        for col, prefix in zip(self.dummy_cols, self.dummy_prefix):
            dummies = X_copy[col].str.get_dummies(
                sep=self.data_sep).add_prefix(f"{prefix}{self.col_name_sep}")
            X_copy = X_copy.join(dummies).drop(columns=col)
        return X_copy

    def get_feature_names_out(self, input_features=None):
        return self.columns.tolist()
