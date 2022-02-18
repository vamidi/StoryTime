export declare type Provider = 'firebase' | 'prisma';

export interface IEnvironment
{
	title?: string,
	production?: boolean,
	appVersion?: string,
	redux?: boolean,
	MAJOR?: number,
	MINOR?: number,
	RELEASE?: string,
	provider?: string,
	firebase?: {
		apiKey?: string,
		authDomain?: string,
		databaseURL?: string,
		projectId?: string,
		storageBucket?: string,
		messagingSenderId?: string,
		appId?: string,
	},
	prisma?: {
		apiKey?: string,
		authDomain?: string,
		hostUrl?: string,
		projectId?: string,
		storageBucket?: string,
		messagingSenderId?: string,
		appId?: string,
		secret?: string,
	},
}
