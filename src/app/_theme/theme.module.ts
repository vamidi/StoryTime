import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	NbActionsModule,
	NbLayoutModule,
	NbMenuModule,
	NbSearchModule,
	NbSidebarModule,
	NbUserModule,
	NbContextMenuModule,
	NbButtonModule,
	NbSelectModule,
	NbCheckboxModule,
	NbIconModule,
	NbThemeModule,
	NbCardModule,
	NbBadgeModule,
	NbInputModule,
	NbAlertModule,
	NbTabsetModule,
	NbAccordionModule,
	NbFormFieldModule,
	NbToggleModule,
	NbAutocompleteModule,
	NbStepperModule, NbSpinnerModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbSecurityModule } from '@nebular/security';

import { RouterModule } from '@angular/router';
import { AvatarModule } from 'ngx-avatar';
import { NbSnackbarModule } from '@app-theme/components/snackbar/snackbar.module';
import { NgxContextMenuModule } from '@app-theme/components/context-menu/context-menu.module';
import { TimeSlicePipe } from '@app-theme/pipes/time-slice.pipe';
import { VisualNEModule } from 'visualne-angular-plugin';
import { VisualNEContextModule } from 'visualne-angular-context-menu-plugin';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { HttpClientModule } from '@angular/common/http';

import {
	FooterComponent,
	HeaderComponent,
	SubHeaderComponent,
	NbNotificationsComponent,
	NgxMenuItemComponent,
	BreadcrumbsComponent,
	SearchInputComponent,
	TinyMCEComponent,
	ChangelogDialogComponent,
	NgxVersionMenuComponent,
	NgxChangeLogMenuComponent,
	NbSearchComponent,
	DateColumnComponent,
	TextColumnComponent,
	TextRenderComponent,
	LinkRenderComponent,

	LanguageRenderComponent,
	LanguageColumnRenderComponent,

	MyNodeComponent,

	TableLoaderComponent,

	// Form components
	ButtonFieldComponent,
	DropDownFieldComponent,
	LabelFieldComponent,
	TextFieldComponent,
	CheckboxFieldComponent,
	FormComponent,
	DynamicFormComponent,
	NgxMenuComponent,
	BooleanColumnRenderComponent,
	NumberColumnComponent,
	LinkColumnRenderComponent,
} from './components';

import {
	NumberComponent,
	DialogueComponent,
	DialogueOptionComponent,
	AddDialogueComponent,
} from '@app-core/components/visualne';

import { FirebaseTableComponent } from './components/firebase-table/firebase-table.component'
import {
	InsertTableComponent,
	InsertMultipleDialogComponent,
	InsertColumnComponent,
	InsertRelationDialogComponent,
	InsertProjectComponent,
	InsertStoryComponent,
	LoadStoryComponent,
	InsertTeamMemberComponent,
	ChangeTableSettingsComponent,
	ChangeProjectSettingsComponent,
	RevisionDialogComponent,
	TableColumnRendererComponent, NodeInspectorComponent,
} from './components/firebase-table/index';

import {
	CapitalizePipe,
	PluralPipe,
	RoundPipe,
	TimingPipe,
	NumberWithCommasPipe,
	PairPipe,
	OrderByPipe,
} from './pipes';
import {
	OneColumnLayoutComponent,
	ThreeColumnsLayoutComponent,
	TwoColumnsLayoutComponent,
	SplitViewColumnsLayoutComponent,
} from './layouts';
import { DigitOnlyDirective } from './directives/digit-only.directive';
import { ClickStopPropagationDirective } from './directives/click-stop-propagation.directive';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Ng2SmartTableModule } from '@vamidicreations/ng2-smart-table';

import { DEFAULT_THEME } from './styles/theme.default';
import { COSMIC_THEME } from './styles/theme.cosmic';
import { CORPORATE_THEME } from './styles/theme.corporate';
import { DARK_THEME } from './styles/theme.dark';

const NB_MODULES = [
	NbLayoutModule,
	NbButtonModule,
	NbMenuModule,
	NbUserModule,
	NbActionsModule,
	NbSearchModule,
	NbSidebarModule,
	NbContextMenuModule,
	NbSecurityModule,
	NbButtonModule,
	NbSelectModule,
	NbCheckboxModule,
	NbInputModule,
	NbIconModule,
	NbEvaIconsModule,
	NbCardModule,
	NbBadgeModule,
	NbAlertModule,
	NbTabsetModule,
	NbAccordionModule,
	NbFormFieldModule,
	NbToggleModule,
	NbAutocompleteModule,
	NbStepperModule,
	NbSnackbarModule.forRoot(),
];

const LIB_MODULES = [
	FormsModule,
	ReactiveFormsModule,
	RouterModule,
	HttpClientModule,

	Ng2SmartTableModule,

	// Third party
	VisualNEModule,
	AvatarModule,
	NgxContextMenuModule,
	BsDropdownModule.forRoot(),
]

const COMPONENTS = [
	HeaderComponent,
	SubHeaderComponent,
	NbNotificationsComponent,
	BreadcrumbsComponent,
	FooterComponent,
	SearchInputComponent,
	NbSearchComponent,
	TinyMCEComponent,
	ChangelogDialogComponent,
	NgxVersionMenuComponent,
	NgxChangeLogMenuComponent,
	OneColumnLayoutComponent,
	ThreeColumnsLayoutComponent,
	TwoColumnsLayoutComponent,
	SplitViewColumnsLayoutComponent,

	// Custom components
	InsertTableComponent,
	FirebaseTableComponent,
	InsertMultipleDialogComponent,
	InsertColumnComponent,
	InsertRelationDialogComponent,
	InsertProjectComponent,
	InsertStoryComponent,
	LoadStoryComponent,
	InsertTeamMemberComponent,
	ChangeTableSettingsComponent,
	ChangeProjectSettingsComponent,
	RevisionDialogComponent,

	NgxMenuItemComponent,
	NgxMenuComponent,

	TableLoaderComponent,

	// VisualNE
	NumberComponent,
	DialogueComponent,
	DialogueOptionComponent,
	AddDialogueComponent,

	// Rendering component
	MyNodeComponent,
	NodeInspectorComponent,

	// Directives
	DigitOnlyDirective,
	ClickStopPropagationDirective,
];

const CUSTOM_FORM_COMPONENTS = [
	FormComponent,
	DynamicFormComponent,
	LabelFieldComponent,
	TextFieldComponent,
	DropDownFieldComponent,
	ButtonFieldComponent,
	CheckboxFieldComponent,
];

const CUSTOM_RENDER_COMPONENTS = [
	// Render Components
	DateColumnComponent,
	TextColumnComponent,
	TextRenderComponent,
	LinkRenderComponent,
	BooleanColumnRenderComponent,
	NumberColumnComponent,
	LinkColumnRenderComponent,
	TableColumnRendererComponent,
	LanguageRenderComponent,
	LanguageColumnRenderComponent,
];

const CUSTOM_ENTRY_COMPONENT = [
	ChangelogDialogComponent,

	InsertTableComponent,
	InsertProjectComponent,
	InsertStoryComponent,
	LoadStoryComponent,
	InsertColumnComponent,
	InsertMultipleDialogComponent,
	InsertRelationDialogComponent,
	InsertTeamMemberComponent,
	ChangeTableSettingsComponent,
	ChangeProjectSettingsComponent,

	MyNodeComponent,
	NumberComponent,
	DialogueComponent,
	DialogueOptionComponent,

	TableLoaderComponent,

	// Render Components
	DateColumnComponent,
	TextColumnComponent,
	TextRenderComponent,
	LinkRenderComponent,
	BooleanColumnRenderComponent,
	NumberColumnComponent,
	LinkColumnRenderComponent,
	TableColumnRendererComponent,
	LanguageRenderComponent,
	LanguageColumnRenderComponent,

	FormComponent,
	DynamicFormComponent,
	LabelFieldComponent,
	TextFieldComponent,
	DropDownFieldComponent,
	ButtonFieldComponent,
	CheckboxFieldComponent,
]

const PIPES = [
	CapitalizePipe,
	PluralPipe,
	RoundPipe,
	TimingPipe,
	NumberWithCommasPipe,
	PairPipe,
	TimeSlicePipe,
	OrderByPipe,
];

@NgModule({
	imports: [
		CommonModule,

		VisualNEContextModule,

		...NB_MODULES,
		...LIB_MODULES,
		NbSpinnerModule,
	],
	exports: [
		CommonModule,
		...PIPES,
		...COMPONENTS,
		...CUSTOM_FORM_COMPONENTS,
		...CUSTOM_RENDER_COMPONENTS,
	],
	declarations: [
		...COMPONENTS,
		...CUSTOM_FORM_COMPONENTS,
		...CUSTOM_RENDER_COMPONENTS,
		...PIPES,
	],
	entryComponents: [
		...CUSTOM_ENTRY_COMPONENT,
	],
})
export class ThemeModule {
	static forRoot(): ModuleWithProviders<ThemeModule> {
		return <ModuleWithProviders<ThemeModule>>{
			ngModule: ThemeModule,
			providers: [
				...NbThemeModule.forRoot(
					{
						name: 'dark',
					},
					[DEFAULT_THEME, COSMIC_THEME, CORPORATE_THEME, DARK_THEME],
				).providers,
			],
		};
	}
}
