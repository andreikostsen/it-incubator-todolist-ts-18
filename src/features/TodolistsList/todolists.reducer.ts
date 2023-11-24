import { todolistsAPI, TodolistType } from "api/todolists-api";
import { appActions, RequestStatusType } from "app/app.reducer";
import {handleServerAppError, handleServerNetworkError} from "utils";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { clearTasksAndTodolists } from "common/actions/common.actions";
import {createAppAsyncThunk} from "../../utils/createAppAsyncThunk";
import {ResultCode} from "../../common/enums/common.enums";

const initialState: TodolistDomainType[] = [];


const slice = createSlice({
  name: "todo",
  initialState,
  reducers: {

    changeTodolistFilter: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
      const todo = state.find((todo) => todo.id === action.payload.id);
      if (todo) {
        todo.filter = action.payload.filter;
      }
    },
    changeTodolistEntityStatus: (state, action: PayloadAction<{ id: string; entityStatus: RequestStatusType }>) => {
      const todo = state.find((todo) => todo.id === action.payload.id);
      if (todo) {
        todo.entityStatus = action.payload.entityStatus;
      }
    }
  },
  extraReducers: (builder) => {
    builder
        .addCase(clearTasksAndTodolists, () => {
          return [];
        })
        .addCase(fetchTodolists.fulfilled, (state, action) => {
          return action.payload.todolists.map((t) => ({...t, filter: 'all', entityStatus: 'idle'}))
        })
        .addCase(removeTodolist.fulfilled, (state, action) => {
          const index = state.findIndex((todo) => todo.id === action.payload.id);
          if (index !== -1) state.splice(index, 1);
        })
        .addCase(addTodolist.fulfilled, (state, action) => {
          const newTodolist: TodolistDomainType = { ...action.payload.todolist, filter: "all", entityStatus: "idle" };
          state.unshift(newTodolist);
        })
        .addCase(changeTodolistTitle.fulfilled, (state, action) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.title = action.payload.title;
            }
        })

  },
});


const fetchTodolists = createAppAsyncThunk<{ todolists: TodolistType[] }, void>(
    'todo/fetchTodolists',
    async (_, thunkAPI) => {
      const {dispatch, rejectWithValue} = thunkAPI;
      try {
        dispatch(appActions.setAppStatus({status: "loading"}));
        const res = await todolistsAPI.getTodolists()
        dispatch(appActions.setAppStatus({status: "succeeded"}));
        return {todolists: res.data};
      } catch (error: any) {
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)
      };
    }
)


const removeTodolist = createAppAsyncThunk<{id:string}, string>(
    `${slice.name}/removeTodolist`, 
    async (id, thunkAPI)=>{
      const {dispatch, rejectWithValue} = thunkAPI;
      try {
        //изменим глобальный статус приложения, чтобы вверху полоса побежала
        dispatch(appActions.setAppStatus({ status: "loading" }));
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(todolistsActions.changeTodolistEntityStatus({ id, entityStatus: "loading" }));
        await todolistsAPI.deleteTodolist(id)
        //скажем глобально приложению, что асинхронная операция завершена
        dispatch(appActions.setAppStatus({ status: "succeeded" }));
        return {id};
        }
      catch (error: any) {
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)
      }
    }
)


const addTodolist = createAppAsyncThunk<{todolist: TodolistType}, string>(
    `${slice.name}/addTodolist`,
    async(title, thunkAPI)=>{
      const {dispatch, rejectWithValue} = thunkAPI;

      try {
        dispatch(appActions.setAppStatus({status: "loading"}));
        const res = await todolistsAPI.createTodolist(title)
        dispatch(appActions.setAppStatus({status: "succeeded"}));
        return {todolist: res.data.data.item};

      }
      catch (error: any) {
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)
      }
    }
)



const  changeTodolistTitle = createAppAsyncThunk< {id: string, title: string }, {id: string, title: string}>(
    `${slice.name}/changeTodolistTitle`,
    async (arg, thunkAPI)=> {

        const {dispatch, rejectWithValue} = thunkAPI;

        try {
            await todolistsAPI.updateTodolist(arg.id, arg.title)
            return {id:arg.id, title: arg.title}
        }
        catch (error: any) {
            handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }

    }
    )



// types
export type FilterValuesType = "all" | "active" | "completed";
export type TodolistDomainType = TodolistType & {
  filter: FilterValuesType;
  entityStatus: RequestStatusType;
};


export const todolistsReducer = slice.reducer;
export const todolistsActions = slice.actions;
export const todoThunks = {fetchTodolists, removeTodolist, addTodolist, changeTodolistTitle}
