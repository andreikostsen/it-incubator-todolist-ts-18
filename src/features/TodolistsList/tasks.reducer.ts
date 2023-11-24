import { TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType } from "api/todolists-api";

import { appActions } from "app/app.reducer";
import { todolistsActions, todoThunks } from "features/TodolistsList/todolists.reducer";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import { clearTasksAndTodolists } from "common/actions/common.actions";
import {createAppAsyncThunk} from "../../utils/createAppAsyncThunk";
import {handleServerAppError, handleServerNetworkError} from "../../utils";


const initialState: TasksStateType = {};

const slice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
        .addCase(fetchTasks.fulfilled, (state, action)=>{
            state[action.payload.todolistId] = action.payload.tasks;
        })
        .addCase(removeTask.fulfilled, (state, action: PayloadAction<{ taskId: string; todolistId: string }>)=>{
            const tasks = state[action.payload.todolistId];
            const index = tasks.findIndex((t) => t.id === action.payload.taskId);
            if (index !== -1) tasks.splice(index, 1);
        })
        .addCase(addTask.fulfilled, (state, action) => {
            const tasks = state[action.payload.task.todoListId];
            tasks.unshift(action.payload.task);
        })
        .addCase(updateTask.fulfilled, (state, action) => {
            const tasks = state[action.payload.todolistId];
            const index = tasks.findIndex((t) => t.id === action.payload.taskId);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...action.payload.model };
            }
        })
           .addCase(todoThunks.removeTodolist.fulfilled, (state, action) => {
            delete state[action.payload.id];
        })
        .addCase(todoThunks.fetchTodolists.fulfilled, (state, action) => {
            action.payload.todolists.forEach((tl) => {
                state[tl.id] = [];
            });
        })
        .addCase(clearTasksAndTodolists, () => {
            return {};
        })

        .addCase(todoThunks.addTodolist.fulfilled, (state, action) => {
            state[action.payload.todolist.id] = []
            })
  },
});


// thunks

export const fetchTasks = createAppAsyncThunk<{tasks: TaskType[], todolistId:string}, string>(
    `${slice.name}/fetchTasks`, async (todolistId, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI;
    try {
        dispatch(appActions.setAppStatus({status: "loading"}));
        const res = await todolistsAPI.getTasks(todolistId);
        dispatch(appActions.setAppStatus({status: "succeeded"}));
        return  {tasks: res.data.items, todolistId};
    }
    catch (error:any) {
       handleServerNetworkError(error, dispatch)
       return  rejectWithValue(null)
    }

});

export const addTask = createAppAsyncThunk< {task:TaskType} , {title: string, todolistId: string}>(
    "tasks/addTask", async ({title, todolistId} , thunkAPI)=> {
        const {dispatch, rejectWithValue} = thunkAPI;
        dispatch(appActions.setAppStatus({status: "loading"}));
        const res = await todolistsAPI.createTask(todolistId, title)
        try {
            if (res.data.resultCode === 0) {
                const task = res.data.data.item;
                dispatch(appActions.setAppStatus({status: "succeeded"}));
               return {task};
            } else {
                handleServerAppError(res.data, dispatch);
                return  rejectWithValue(null)
            }
        }
        catch (error: any) {
            handleServerNetworkError(error, dispatch);
            return  rejectWithValue(null)
        }
    })



export const removeTask = createAppAsyncThunk<{taskId:string, todolistId:string}, {todolistId:string, taskId: string} > (
    "tasks/removeTask", async ( {todolistId, taskId}, thunkAPI)=>{
        const {rejectWithValue} = thunkAPI;
        try {
            await todolistsAPI.deleteTask(todolistId, taskId)
            return {taskId, todolistId};
        }
        catch (e) {
            return  rejectWithValue(null)
        }
    })


const updateTask =createAppAsyncThunk<{taskId: string,  model: UpdateDomainTaskModelType,  todolistId: string}, { taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string }> (
    "tasks/updateTask",
    async ({taskId, domainModel, todolistId}, thunkAPI) => {
        const {dispatch, rejectWithValue, getState} = thunkAPI;

        const state = getState();

        const task = state.tasks[todolistId].find((t) => t.id === taskId);
        if (!task) {
           return rejectWithValue(null);
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...domainModel,
        };

        const res = await todolistsAPI.updateTask(todolistId, taskId, apiModel)
        try {
            if (res.data.resultCode === 0) {
                return {taskId, model: domainModel, todolistId};
            } else {
                handleServerAppError(res.data, dispatch);
                return rejectWithValue(null)
            }
        } catch (error) {
            handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }
    }
    )


// types
export type UpdateDomainTaskModelType = {
  title?: string;
  description?: string;
  status?: TaskStatuses;
  priority?: TaskPriorities;
  startDate?: string;
  deadline?: string;
};
export type TasksStateType = {
  [key: string]: Array<TaskType>;
};

export const tasksReducer = slice.reducer;
export const tasksActions = slice.actions;
export const tasksThunks = {fetchTasks, addTask, removeTask, updateTask}