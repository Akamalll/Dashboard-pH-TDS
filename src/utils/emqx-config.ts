// Konfigurasi EMQX API
export const EMQX_CONFIG = {
  API_ENDPOINT: 'https://d6916faa.ala.eu-central-1.emqxsl.com:8443/api/v5',
  API_KEY: process.env.NEXT_PUBLIC_EMQX_API_KEY || '',
  API_SECRET: process.env.NEXT_PUBLIC_EMQX_API_SECRET || '',
};

// Fungsi untuk membuat header autentikasi
export const getAuthHeaders = () => {
  const auth = Buffer.from(`${EMQX_CONFIG.API_KEY}:${EMQX_CONFIG.API_SECRET}`).toString('base64');
  return {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };
};

// Fungsi untuk membuat credentials baru
export const createCredentials = async (username: string, password: string) => {
  try {
    const response = await fetch(`${EMQX_CONFIG.API_ENDPOINT}/authentication/password_based:built_in_database/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_id: username,
        password: password,
        is_superuser: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating credentials:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan daftar credentials
export const getCredentials = async () => {
  try {
    const response = await fetch(`${EMQX_CONFIG.API_ENDPOINT}/authentication/password_based:built_in_database/users`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting credentials:', error);
    throw error;
  }
};

// Fungsi untuk menghapus credentials
export const deleteCredentials = async (username: string) => {
  try {
    const response = await fetch(`${EMQX_CONFIG.API_ENDPOINT}/authentication/password_based:built_in_database/users/${username}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting credentials:', error);
    throw error;
  }
};
