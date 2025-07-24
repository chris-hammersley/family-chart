// Utility functions for API calls to /api/family (MongoDB)
// All functions now require honoreeId and authContext
export async function savePersonToDB(person, honoreeId, authContext) {
  const res = await fetch(`/api/family/${honoreeId}`, {
    method: person._isNew ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(authContext?.token ? { 'Authorization': `Bearer ${authContext.token}` } : {})
    },
    body: JSON.stringify(person)
  });
  if (!res.ok) throw new Error('Failed to save person');
  return await res.json();
}

export async function deletePersonFromDB(id, honoreeId, authContext) {
  const res = await fetch(`/api/family/${honoreeId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(authContext?.token ? { 'Authorization': `Bearer ${authContext.token}` } : {})
    },
    body: JSON.stringify({ id })
  });
  if (!res.ok) throw new Error('Failed to delete person');
}
