const apiMiddleware = store => next => async action => {
  if (!action.meta?.api) return next(action);

  const { endpoint, method = 'GET', body } = action.meta.api;
  
  try {
    const response = await fetch(`/api/nst/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    console.log(`API ${method} ${endpoint}:`, data);
    
    return next({
      ...action,
      payload: data
    });
  } catch (error) {
    console.error(`API Error ${endpoint}:`, error);
    return next({
      ...action,
      error: true,
      payload: error.message
    });
  }
};

export default apiMiddleware;
