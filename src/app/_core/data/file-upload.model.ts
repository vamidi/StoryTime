export interface IFileMetaData
{
	customMetadata?: {
		[/* warning: coerced from ? */ key: string]: string; } | null;
}

export interface AnimalProperties {
	species?: string;
	id?: string;
	color?: string;
}

export class FileUpload {
	id?: string;
	name!: string;	// filename + extension
	url!: string;

	file!: File;
	metadata: IFileMetaData

	data!: string;           // JSON data of the story

	// Proxy
	deleted!: boolean;
	created_at!: number | Object;
	updated_at!: number | Object;

	constructor(data: any = {})
	{
		for (const key in data) {
			if(data.hasOwnProperty(key))
				this[key] = data[key];
		}
	}
}
