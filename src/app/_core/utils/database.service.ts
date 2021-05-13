import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';

@Injectable({ providedIn: 'root' })
/**
 * @brief DatabaseService - is a service that handles all the data in the app.
 * The user can make use of Firebase as an endpoint to get all their data.
 * 1. Firebase is the main endpoint.
 * 2. Prisma to handle all the MySQL, PostgreSQL, SQLite
 * 3. TODO MongoDB
 */
export class DatabaseService implements OnDestroy
{
	// 1. First handle firebase.

	// 2. Handle Prisma

	// 3.

	//
	httpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
	};

	constructor(
		private firebaseService: FirebaseService,
		private readonly http: HttpClient,
	) {

	}

	public ngOnDestroy() {

	}
}
