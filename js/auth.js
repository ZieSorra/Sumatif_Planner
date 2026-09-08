async function login(email, password) {

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        throw error;
    }

    return data;
}


async function logout() {

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {
        throw error;
    }

}


async function getCurrentUser() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    return user;
}


async function getProfile(userId) {

    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

    if (error) {
        throw error;
    }

    return data;
}
