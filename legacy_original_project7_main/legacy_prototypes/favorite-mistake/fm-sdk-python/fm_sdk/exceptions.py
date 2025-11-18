class FMError(Exception):
    pass


class FMTimeout(FMError):
    pass


class FMServerError(FMError):
    pass
