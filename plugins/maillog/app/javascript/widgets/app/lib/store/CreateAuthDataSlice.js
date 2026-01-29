// export const AUTH_ACTIONS = {
//     SIGN_ON: "signOn",
//     SIGN_OUT: "signOut",
// };

const createAuthDataSlice = (set, get) => ({
    auth: {
        token: null,
        project: null,
        // isProcessing: false,
        // loggedIn: false,
        // error: null,
        // lastAction: {},
        // appLoaded: false,
        // appIsLoading: false,

        actions: {
            // setAppLoaded: (appLoaded) => {
            //     set(
            //         (state) => ({auth: {...state.auth, appLoaded}}),
            //         false,
            //         "auth/setAppLoaded"
            //     );
            // },
            setAuthData: (data) => {

                if (!data) return;
                // check if data has changed before updating the state
                if (data.token === get().auth.token &&
                    data.project === get().auth.project
                )
                    return;
                set(
                    (state) => (
                        {

                        auth: {
                            ...state.auth,
                            token: data?.token,
                            project: data?.project
                        },
                    }),
                    false,
                    "auth/setAuthData"
                );
            },
            // setAction: (name) =>
            //     set(
            //         (state) => ({
            //             auth: {
            //                 ...state.auth,
            //                 lastAction: {name: name, updatedAt: Date.now()},
            //             },
            //         }),
            //         false,
            //         "auth/setAction"
            //     ),
            // login: () => get().auth.actions.setAction(AUTH_ACTIONS.SIGN_ON),
            // logout: () => get().auth.actions.setAction(AUTH_ACTIONS.SIGN_OUT),
        },
    },
});

export default createAuthDataSlice;





