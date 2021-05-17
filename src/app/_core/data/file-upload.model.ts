import { ProxyObject } from '@app-core/data/base';
import { UtilsService } from '@app-core/utils';

export class FileUpload implements ProxyObject {
	key!: string;
	name!: string;
	url!: string;

	file: File;

	// Proxy
	deleted: boolean = false;
	created_at: Object = UtilsService.timestamp;
	updated_at: Object = UtilsService.timestamp;

	constructor(file: File) {
		this.file = file;
	}
}
