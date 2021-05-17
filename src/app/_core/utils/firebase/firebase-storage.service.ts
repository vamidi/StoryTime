import { Injectable, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AngularFireStorage, AngularFireStorageReference } from '@angular/fire/storage';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { Project, StoryFileUpload } from '@app-core/data/state/projects';
import { CraftableFileUpload } from '@app-core/data/state/tables';
import { UtilsService } from '@app-core/utils';
import { FileUpload } from '@app-core/data/file-upload.model';

import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { UploadMetadata } from '@angular/fire/storage/interfaces';
import { NbToastrService } from '@nebular/theme';

import firebase from 'firebase/app';
import 'firebase/storage';
import { AngularFireList } from '@angular/fire/database/interfaces';

export declare type NbLocationFileType = 'Default' | 'Story' | 'Craftable'
declare type NbFileType = FileUpload | StoryFileUpload | CraftableFileUpload;

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
		path: string, fileUpload: NbFileType, location: NbLocationFileType = 'Default', metadata?: UploadMetadata,
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
					this.saveFileData(location, fileUpload);
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

	public getFiles<T extends FileUpload | StoryFileUpload | CraftableFileUpload>(path: string, numberItems: number)
		: AngularFireList<T>
	{
		return this.firebaseService.getList<T>(path, ref => ref.limitToLast(numberItems));
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
		this.deleteFileDatabase(location, fileUpload.key)
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
	private saveFileData(location: NbLocationFileType, fileUpload: NbFileType): void
	{
		switch(location)
		{
			case 'Default':
				this.firebaseService.insert(fileUpload, this.Base);
				break;
			case 'Story':
				this.firebaseService.insert(fileUpload, 'stories')
				break;
			case 'Craftable':
				this.firebaseService.insert(fileUpload, 'craftables')
				break;
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
