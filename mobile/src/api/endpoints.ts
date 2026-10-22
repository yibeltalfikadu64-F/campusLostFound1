import { apiClient } from './client';

export const api = {
  // Auth
  auth: {
    register: (data: any) => apiClient.post('/auth/register', data).then((res) => res.data),
    login: (data: any) => apiClient.post('/auth/login', data).then((res) => res.data),
    logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }).then((res) => res.data),
    refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }).then((res) => res.data)
  },

  // Users
  users: {
    getMe: () => apiClient.get('/users/me').then((res) => res.data),
    updateMe: (data: any) => apiClient.patch('/users/me', data).then((res) => res.data),
    updatePassword: (data: any) => apiClient.patch('/users/me/password', data).then((res) => res.data),
    updatePushToken: (pushToken: string) => apiClient.post('/users/me/push-token', { pushToken }).then((res) => res.data),
    getMyItems: () => apiClient.get('/users/me/items').then((res) => res.data),
    getMyClaims: () => apiClient.get('/users/me/claims').then((res) => res.data)
  },

  // Items
  items: {
    list: (params?: any) => apiClient.get('/items', { params }).then((res) => res.data),
    getById: (id: string) => apiClient.get(`/items/${id}`).then((res) => res.data),
    create: (data: any) => apiClient.post('/items', data).then((res) => res.data),
    update: (id: string, data: any) => apiClient.patch(`/items/${id}`, data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/items/${id}`).then((res) => res.data),
    updateStatus: (id: string, data: any) => apiClient.patch(`/items/${id}/status`, data).then((res) => res.data),
    getHistory: (id: string) => apiClient.get(`/items/${id}/history`).then((res) => res.data),
    submitClaim: (id: string, data: any) => apiClient.post(`/items/${id}/claims`, data).then((res) => res.data),
    getItemClaims: (id: string) => apiClient.get(`/items/${id}/claims`).then((res) => res.data),
    uploadImages: (formData: FormData) =>
      apiClient.post('/items/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then((res) => res.data)
  },

  // Claims
  claims: {
    getMine: () => apiClient.get('/claims/mine').then((res) => res.data),
    getById: (id: string) => apiClient.get(`/claims/${id}`).then((res) => res.data),
    approve: (id: string, data?: any) => apiClient.patch(`/claims/${id}/approve`, data || {}).then((res) => res.data),
    reject: (id: string, data: any) => apiClient.patch(`/claims/${id}/reject`, data).then((res) => res.data),
    scheduleHandover: (id: string, data: any) => apiClient.patch(`/claims/${id}/handover`, data).then((res) => res.data),
    confirmReturn: (id: string) => apiClient.patch(`/claims/${id}/confirm-return`).then((res) => res.data)
  },

  // Categories & Locations
  categories: {
    list: (params?: any) => apiClient.get('/categories', { params }).then((res) => res.data),
    create: (data: any) => apiClient.post('/categories', data).then((res) => res.data),
    update: (id: string, data: any) => apiClient.patch(`/categories/${id}`, data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/categories/${id}`).then((res) => res.data)
  },
  locations: {
    list: (params?: any) => apiClient.get('/locations', { params }).then((res) => res.data),
    create: (data: any) => apiClient.post('/locations', data).then((res) => res.data),
    update: (id: string, data: any) => apiClient.patch(`/locations/${id}`, data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/locations/${id}`).then((res) => res.data)
  },

  // Notifications
  notifications: {
    list: () => apiClient.get('/notifications').then((res) => res.data),
    markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`).then((res) => res.data),
    markAllAsRead: () => apiClient.patch('/notifications/read-all').then((res) => res.data)
  },

  // Admin
  admin: {
    getStats: () => apiClient.get('/admin/stats').then((res) => res.data),
    listUsers: (params?: any) => apiClient.get('/admin/users', { params }).then((res) => res.data),
    updateUserStatus: (id: string, data: any) => apiClient.patch(`/admin/users/${id}/status`, data).then((res) => res.data),
    listClaims: (params?: any) => apiClient.get('/admin/claims', { params }).then((res) => res.data),
    getReports: (params?: any) => apiClient.get('/admin/reports', { params }).then((res) => res.data),
    moderateItem: (id: string, data: any) => apiClient.patch(`/admin/items/${id}/moderation`, data).then((res) => res.data)
  }
};
