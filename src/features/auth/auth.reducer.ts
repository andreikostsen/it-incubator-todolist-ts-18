import { authAPI, LoginParamsType } from "api/todolists-api";
import { handleServerAppError, handleServerNetworkError } from "utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {appActions, appReducer} from "app/app.reducer";
import { clearTasksAndTodolists } from "common/actions/common.actions";
import {createAppAsyncThunk} from "../../utils/createAppAsyncThunk";
import {fetchTasks} from "../TodolistsList/tasks.reducer";

const slice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: false,

  },
  reducers: {
      // setIsLoggedIn: (state, action: PayloadAction<{ isLoggedIn: boolean }>) => {
      //     state.isLoggedIn = action.payload.isLoggedIn;
      // }

  },
      extraReducers: (builder) => {
          builder
              .addCase(login.fulfilled, (state, action)=>{
                  state.isLoggedIn = action.payload.isLoggedIn;
              })
              .addCase(logout.fulfilled, (state, action)=>{
                  state.isLoggedIn = action.payload.isLoggedIn;
              })
              .addCase(initializeApp.fulfilled, (state, action) => {
                  state.isLoggedIn = action.payload.isLoggedIn;
              })
  },
});



// thunks

const login = createAppAsyncThunk<{isLoggedIn: boolean}, LoginParamsType>(
    `${slice.name}/login`,
    async (arg, thunkAPI)=>{
    const {dispatch, rejectWithValue} = thunkAPI;
try {
    dispatch(appActions.setAppStatus({ status: "loading" }));
    const res = await authAPI.login(arg)
            if (res.data.resultCode === 0) {
                 dispatch(appActions.setAppStatus({ status: "succeeded" }));
                 return  { isLoggedIn: true };

            } else {
                handleServerAppError(res.data, dispatch);
                return  rejectWithValue(null)
            }
}
catch (error:any) {
    handleServerNetworkError(error, dispatch)
    return  rejectWithValue(null)
}

}
)




const logout = createAppAsyncThunk<{isLoggedIn: boolean}, undefined> (
    `${slice.name}/logout`, async (_, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI;
        try {
            dispatch(appActions.setAppStatus({ status: "loading" }));
            const res =  await authAPI.logout()
                      if (res.data.resultCode === 0) {
                        dispatch(clearTasksAndTodolists());
                        dispatch(appActions.setAppStatus({ status: "succeeded" }));
                        return { isLoggedIn: false };
                    } else {
                        handleServerAppError(res.data, dispatch);
                        return  rejectWithValue(null)
                    }
                }
        catch (error:any) {
            handleServerNetworkError(error, dispatch)
            return  rejectWithValue(null)
        }
    }
)


const initializeApp = createAppAsyncThunk<{ isLoggedIn: boolean }, undefined>(
    `${slice.name}/initializeApp`,
    async (_, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI;
        try {
            const res = await authAPI.me()
            if (res.data.resultCode === 0) {
                return {isLoggedIn: true};
            } else {
                //handleServerAppError(res.data, dispatch);
                return rejectWithValue(null)
            }

        } catch (error: any) {
            handleServerNetworkError(error, dispatch)
            return rejectWithValue(null)
        }
        finally {
            dispatch(appActions.setAppInitialized({ isInitialized: true }));
        }
    }
)

export const authReducer = slice.reducer;
export const authActions = slice.actions;
export const authThunks = {login, logout, initializeApp};

