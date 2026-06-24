import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            async authorize(credentials) {
                try {
                    const response = await fetch(`${url}/user/post/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(credentials),
                    });

                    const data = await response.json();

                    if (!response.ok) {

                        if (response.status === 401) {
                            // return null;
                            throw new Error(data.error || 'Login failed');
                        }
                        throw new Error(data.message || 'Login failed');
                    }

                    if (data.token) {

                        return {
                            id: data.user_id,
                            token: data.token,
                            master_user_type: data.master_user_type,
                            user_type: data.user_type,
                            email: data.email,
                            mobile_no: data.mobile_no,
                            first_name: data.first_name,
                            last_name: data.last_name,
                            avatar_image: data.avatar_image,
                            logSession: data.logSession,
                        };
                    } else {
                        throw new Error('Invalid token in response');
                    }
                } catch (error) {
                    console.error('Login failed:', error);
                    throw new Error(error.message || 'Login failed');
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.token = user.token;
                token.user_type = user.user_type;
                token.master_user_type = user.master_user_type;
                token.email = user.email;  // Include email in token
                token.logSession = user.logSession;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token.id,
                token: token.token,
                user_type: token.user_type,
                email: token.email,
                master_user_type: token.master_user_type,
                logSession: token.logSession,
            };
            return session;
        },
    },
    cookies: {
        sessionToken: {
            name: 'next-auth.session-token',  // Custom cookie name
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production', // Secure only in production
            },
        },
    },
    pages: {
        signIn: '/auth/signin',  // Customize sign-in page
        error: '/auth/error',    // Customize error page
    },
    secret: process.env.NEXTAUTH_SECRET,  // Ensure this is set in your environment variables
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
