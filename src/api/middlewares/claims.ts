import { UserMetaData } from '@prisma/client';

export const makeClaims = async (userMetadata: UserMetaData) =>
{
	return {
		name: "Demo",
		picture: "",
		iss: `https://securetoken.google.com/${ process.env.DATABASE_AUDIENCE_CLAIM }`,
		aud: process.env.DATABASE_AUDIENCE_CLAIM,
		auth_time: Math.floor(Date.now() / 1000),
		uid: userMetadata.userId,
		user_id: userMetadata.userId,
		sub: userMetadata.userId,
		email: userMetadata.email,
		email_verified: false,
		prisma: {
			identities: {
				email: [
					"valencio_masaki16@live.nl"
				]
			},
			sign_in_provider: "password"
		}
	}
}
