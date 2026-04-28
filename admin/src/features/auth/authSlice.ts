import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit'
import api, { setAccessToken } from '../../utils/api'

interface AuthState {
  user: any | null
  token: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
}

// Thunk for login — POST to the requested endpoint
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Build full absolute URL to avoid duplicating base path in api.baseURL
      const apiRoot = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000'
      const loginUrl = `${apiRoot.replace(/\/$/, '')}/api/v1/platform-b/auth/login`
      const res = await api.post(loginUrl, payload)

      // Support several response shapes
      const token = res.data?.data?.accessToken || res.data?.accessToken || res.data?.token || null
      const user = res.data?.data?.user || res.data?.user || res.data?.data || null

      if (!token) {
        // still accept but warn — but for login we need token
        return rejectWithValue('No access token returned from server')
      }

      // persist token in api helper
      setAccessToken(token)

      return { user, token }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Login failed'
      return rejectWithValue(message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state: AuthState) {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
      .addCase(loginUser.pending, (state: AuthState) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state: AuthState, action: PayloadAction<any>) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
      })
      .addCase(loginUser.rejected, (state: AuthState, action: any) => {
        state.status = 'failed'
        state.error = action.payload || action.error?.message || 'Login failed'
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
