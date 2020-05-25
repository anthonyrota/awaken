export const throw_ = (message: string) => () => {
    throw new Error(message);
};
