import { Injectable, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AngularFireStorage, AngularFireStorageReference } from '@angular/fire/storage';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { Project, StoryFileUpload } from '@app-core/data/state/projects';
import { CraftableFileUpload } from '@app-core/data/state/tables';
import { UtilsService } from '@app-core/utils';
import { FileUpload } from '@app-core/data/file-upload.model';
import { AngularFireList, QueryFn } from '@angular/fire/database/interfaces';

import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { NbToastrService } from '@nebular/theme';

import firebase from 'firebase/app';
import 'firebase/storage';

export declare type NbLocationFileType = 'Default' | 'Story' | 'Craftable'
declare type NbFileType = FileUpload | StoryFileUpload | CraftableFileUpload;

const NUMBER_OF_ITEMS = 6

@Injectable({ providedIn: 'root' })
export class FirebaseStorageService
{
	public get Base()
	{
		UtilsService.onAssert(this.project, `Did you set the project?`);
		return `${this.BASE_STORAGE_PATH}/${this.project.id}`;
	}

	public get Project(): Project { return this.project; }
	public set Project(project: Project)
	{
		this.project = project;
	}

	// Path to the storage bucket
	private readonly BASE_STORAGE_PATH: string = `node-editor/projects`;

	private project: Project = null;

	private headers: HttpHeaders = new HttpHeaders({
	// 	'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	});

	// TODO add version control

	constructor(
		protected firebaseStorage: AngularFireStorage,
		protected firebaseService: FirebaseService,
		protected toastrService: NbToastrService,
		protected http: HttpClient,
	) { }

	/**
	 * upload file to firebase.
	 * @param path
	 * @param location
	 * @param fileUpload
	 * @param metadata
	 */
	public pushFileToStorage(
		path: string, fileUpload: NbFileType,
		location: NbLocationFileType = 'Default',
		metadata?: firebase.storage.UploadMetadata,
	): Observable<firebase.storage.UploadTaskSnapshot>
	{
		const filePath = `${this.Base}/${path}/${fileUpload.file.name}`;
		const storageRef = this.firebaseStorage.ref(filePath);
		const uploadTask = this.firebaseStorage.upload(filePath, fileUpload.file, metadata);

		return uploadTask.snapshotChanges().pipe(
			finalize(() =>
			{
				storageRef.getDownloadURL().subscribe(downloadURL =>
				{
					fileUpload.url = downloadURL;
					fileUpload.name = fileUpload.file.name;
					if(fileUpload.hasOwnProperty('id'))
						this.updateFileData(location, fileUpload).then();
					else
						this.saveFileData(location, fileUpload).then((ref) => fileUpload.id = ref.key);
				});
			}),
		);
	}

	/**
	 *
	 * @param path
	 */
	public getRef(path: string): AngularFireStorageReference
	{
		const endPath = `${this.Base}/${path}`;

		return this.firebaseStorage.ref(endPath);
	}

	/**
	 *
	 * @param path
	 */
	public getList(path: string): Promise<firebase.storage.ListResult>
	{
		const endPath = `${this.Base}/${path}`;
		const ref = this.firebaseStorage.ref(endPath);

		return ref.listAll().toPromise();
	}

	public getFiles<T extends FileUpload | StoryFileUpload | CraftableFileUpload>(
		path: string, queryFn: QueryFn = ref => ref.limitToLast(NUMBER_OF_ITEMS),
	): AngularFireList<T>
	{
		return this.firebaseService.getList<T>(path, queryFn);
	}

	/**
	 *
	 * @param url
	 */
	public getJsonFile(url: string): Promise<Blob>
	{
		return this.http.get(url, { responseType: 'blob' }).toPromise();
	}

	public deleteFile(location: NbLocationFileType, fileUpload: FileUpload): void {
		this.deleteFileDatabase(location, fileUpload.id)
			.then(() => {
				this.deleteFileStorage(location, fileUpload.name);
			})
			.catch(error => console.log(error));
	}

	/**
	 *
	 * @param location
	 * @param fileUpload
	 * @private
	 */
	private saveFileData(location: NbLocationFileType, fileUpload: NbFileType): firebase.database.ThenableReference
	{
		switch(location)
		{
			case 'Default':
				return this.firebaseService.insert(fileUpload, this.Base);
			case 'Story':
				return this.firebaseService.insert(fileUpload, 'stories');
			case 'Craftable':
				return this.firebaseService.insert(fileUpload, 'craftables');
		}
	}

	/**
	 *
	 * @param location
	 * @param fileUpload
	 * @private
	 */
	private updateFileData(location: NbLocationFileType, fileUpload: NbFileType): Promise<void|string>
	{
		console.log(location);
		switch(location)
		{
			case 'Default':
				return this.firebaseService.update(this.Base, fileUpload);
			case 'Story':
				return this.firebaseService.updateItem(fileUpload.id, fileUpload, true, 'stories');
			case 'Craftable':
				return this.firebaseService.updateItem(fileUpload.id, fileUpload, true, 'craftables');
		}
	}

	private deleteFileDatabase(location: NbLocationFileType, key: string): Promise<void|string>
	{
		switch(location)
		{
			case 'Default':
				return this.firebaseService.deleteItem(key, this.Base);
			case 'Story':
				return this.firebaseService.deleteItem(key, 'stories');
			case 'Craftable':
				return this.firebaseService.deleteItem(key, 'craftables');
		}
	}

	private deleteFileStorage(location: NbLocationFileType, name: string): void
	{
		let path: string = null;
		switch(location)
		{
			case 'Default':
				path = this.Base;
				break;
			case 'Story':
				path ='stories';
				break;
			case 'Craftable':
				path = 'craftables';
				break;
		}


		const storageRef = this.firebaseStorage.ref(path);
		storageRef.child(name).delete();
	}
}
