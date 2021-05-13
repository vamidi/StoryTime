import { async, TestBed, inject, tick, fakeAsync, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FirebaseTableComponent } from './firebase-table/firebase-table.component';
import { FirebaseService } from '../utils/firebase/firebase.service';


describe('FirebaseService', () => {
	let component: FirebaseTableComponent;
	let fixture: ComponentFixture<FirebaseTableComponent>;
	let de: DebugElement;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [
				FirebaseTableComponent,
			],
			providers: [
				FirebaseService,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FirebaseTableComponent);
		component = fixture.componentInstance;
		de = fixture.debugElement;

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
