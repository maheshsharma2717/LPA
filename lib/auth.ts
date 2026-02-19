import { supabase } from './supabase';


export async function getAuthUser(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        throw new Error(error?.message || 'Unauthorized');
    }

    return user;
}
