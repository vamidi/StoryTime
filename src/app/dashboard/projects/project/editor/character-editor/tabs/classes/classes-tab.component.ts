import { Component, OnInit, ViewChild } from '@angular/core';
import { EChartsOption } from 'echarts';
import { LineSeriesOption } from 'echarts/types/src/chart/line/LineSeries';
import { BaseTabComponent } from '@app-dashboard/projects/project/editor/character-editor/tabs/Base/base-tab.component';
import { UtilsService } from '@app-core/utils';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { NbDialogService, NbMenuService, NbSelectComponent, NbThemeService, NbToastrService } from '@nebular/theme';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { UserService } from '@app-core/data/state/users';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { ICharacterClass, IParameterCurve, ISkill } from '@app-core/data/standard-tables';

import { DynamicFormComponent, TextFieldComponent } from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { InsertMultipleDialogComponent } from '@app-theme/components/firebase-table';
import { BaseSettings } from '@app-core/mock/base-settings';
import { NbMenuItem } from '@nebular/theme/components/menu/menu.service';
import { filter } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { BehaviourType } from '@app-core/types';

@Component({
	selector: 'ngx-classes-tab',
	templateUrl: 'classes-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class ClassesTabComponent extends BaseTabComponent implements OnInit
{
	public get getSkillTbl(): Table<ISkill>
	{
		return this.skills;
	}

	public get getSkillSettings(): BaseSettings
	{
		return this.skillsSettings;
	}

	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('classNameField', { static: true})
	public classNameField: TextFieldComponent = null;

	@ViewChild('classExperienceCurveField', { static: true})
	public classExperienceCurveField: TextFieldComponent = null;

	public selectedClass: ICharacterClass = null;

	public source: BaseFormSettings = {
		title: 'Class Settings',
		alias: 'class-settings',
		requiredText: 'Fill in all the fields',
		fields: {},
	};

	public cardOptions: Map<number | string, NbMenuItem[]> = new Map<number | string, NbMenuItem[]>();

	public eCharLevelOptions: EChartsOption = null;

	public classCurves: IParameterCurve[] = [];
	public classConfigs: EChartsOption[] = [];

	protected parameterCurvesSettings: BaseSettings = new BaseSettings();
	protected parameterCurves: Table<IParameterCurve> = null;

	protected skillsSettings: BaseSettings = new BaseSettings();
	protected skills: Table<ISkill> = null;

	// Health Points or HP - represents the amount of damage a character can take before dying or being knocked out.
	// Magic Points or MP -
	// represents the amount of magical power a character has. Higher the power, the more spells can be cast.
	// Speed -
	// represents how fast the character moves. Determines frequency of attacks and chance to dodge incoming attacks.
	// AGI: {},
	// Intelligence -
	// represents how clever the character is. Determines power of spells and ability to resist magic attacks.
	// INT: {},

	protected conditionalGrowth:
		{ [key:string]: { condition: string, level: number, minMaxLevel?: number, growthValue: string | number }[] } =
		{
			'TP': [
				{
					condition: '==',
					level: 91,
					growthValue: 0.01,
				},
				{
					condition: '>=',
					level: 92,
					minMaxLevel: 110,
					growthValue: 0.015,
				},
				{
					condition: '==',
					level: 111,
					growthValue: 0.02,
				},
				{
					condition: '==',
					level: 112,
					growthValue: 0.02,
				},
				{
					condition: '>=',
					level: 113,
					minMaxLevel: 123,
					growthValue: 'prev + 0.005',
				},
				{
					condition: '==',
					level: 122,
					growthValue: 0.06,
				},
				{
					condition: '>=',
					level: 124,
					minMaxLevel: 200,
					growthValue: 0.07,
				},
			],
		}

	protected modifiers: { [key: string]: any } = {};

	public constructor(
		protected router: Router,
		protected route: ActivatedRoute,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected userService: UserService,
		protected projectsService: ProjectsService,
		protected themeService: NbThemeService,
		protected menuService: NbMenuService,

		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected dialogService: NbDialogService,
		protected userPreferencesService: UserPreferencesService,
		protected tableService: TablesService,
		protected languageService: LanguageService,
	) {
		super(route, firebaseService, userService, projectsService, router, toastrService, snackbarService, dialogService,
			userPreferencesService, tableService, firebaseRelationService, languageService, '-MhJZ87ovi4ki7Lqdh9o');
	}

	public ngOnInit()
	{
		super.ngOnInit();

		this.mainSubscription.add(this.menuService.onItemClick()
			.pipe(
				filter(({ tag }) => tag === 'open-parameter-menu'),
			).subscribe(({ item: { title, data } }) => this.onCardOptionClicked(title, data)));

		this.formComponent.showLabels = true;

		// Text box question
		this.formComponent.addInput<string>(this.classNameField, {
			controlType: 'textbox',
			value: '',
			name: 'class-name',
			text: 'Class name',
			placeholder: 'Class name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		// Text box question
		this.formComponent.addInput<string>(this.classExperienceCurveField, {
			controlType: 'textbox',
			value: '',
			name: 'class-exp',
			text: 'Class Experience',
			placeholder: 'Experience curve',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.mainSubscription.add(this.project$.subscribe((project: Project) =>
		{
			if(project)
			{
				this.tableService.loadTablesFromProject(project, ['parametercurves', 'skills'], (table) => this.loadTable(table))
					.then();

				// Important or data will not be caught.
				this.getTableData(this.settings);
			}
		}));
	}

	public addMultiple()
	{
		super.addMultiple({
			context: {
				title: 'Add a new class',
				tblName: 'classes',
				settings: this.settings,
			},
		});
	}

	/**
	 * @brief - when we click on a class
	 * @param event
	 */
	public onClassClicked(event: number)
	{
		this.selectedClass = null;
		this.classCurves = [];
		this.classConfigs = [];
		this.eCharLevelOptions = null;
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedClass = UtilsService.copyObj(this.table.find(event)) as ICharacterClass;
			if(this.selectedClass)
			{
				this.classNameField.setValue = this.selectedClass.className['en'];
				this.classExperienceCurveField.setValue = this.selectedClass.expCurve;
				// second parameter specifying whether to perform 'AND' or 'OR' search
				// (meaning all columns should contain search query or at least one)
				// 'AND' by default, so changing to 'OR' by setting false here
				this.configureStats();
				this.validate();
			}
		} else this.validate();

		this.skills.getSource.setFilter([
			// fields we want to include in the search
			{
				field: 'classId',
				search: this.selectedClass !== null ? this.selectedClass.id.toString() : 'NaN',
			},
		], false);
	}

	public insertStat()
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent,{
			context: {
				title: 'Add a new stat',
				tblName: 'parameterCurves',
				settings: this.parameterCurvesSettings,
			},
		});


		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) =>
		{
			switch(event.insertType)
			{
				case BehaviourType.INSERT:
					this.onCreateConfirm(event, this.parameterCurves.id);
					break;
				case BehaviourType.UPDATE:
				default:
					this.onEditConfirm(event, true, this.parameterCurves.id);
					break;
			}
		});
	}

	public getCardOption(id: number): NbMenuItem[]
	{
		if(!this.cardOptions.has(id))
		{
			const menu: NbMenuItem[] = [{ title: 'Edit', data: { id: id } }, { title: 'Delete', data: { id: id } }];
			this.cardOptions.set(id, menu);
		}

		return this.cardOptions.get(id);
	}

	public onCardOptionClicked(title: string, data: any)
	{
		const paramCurve = { ...this.parameterCurves.find(data.id) } as IParameterCurve;
		switch(title.toLowerCase())
		{
			case 'edit':
				const ref = this.dialogService.open(InsertMultipleDialogComponent, {
					context: {
						title: 'Update stat',
						tblName: this.parameterCurves.title,
						settings: this.parameterCurvesSettings,
						data: paramCurve,
						behaviourType$: new BehaviorSubject<BehaviourType>(BehaviourType.UPDATE),
					},
				});

				// Otherwise scope will make this undefined in the method
				ref.componentRef.instance.insertEvent.subscribe((event: any) =>
				{
					switch(event.insertType)
					{
						case BehaviourType.INSERT:
							this.onCreateConfirm(event);
							break;
						case BehaviourType.UPDATE:
						default:
							this.onEditConfirm(event, true);
							break;
					}
				});
				break;
			case 'delete':
				if (window.confirm('Are you sure you want to delete?'))
				{
					this.onDeleteConfirm({ data: paramCurve }, null, this.parameterCurves.id);
				}
				break;
		}
	}

	public onSendForm()
	{
		if(this.formComponent.isValid)
		{
			const dbClass = this.table.find(this.selectedClass.id);
			const event = {
				data: dbClass,
				newData: null,
				confirm: {
					resolve: () => {
						this.table.update(dbClass, this.selectedClass).then();
						return true;
					},
					reject: (): boolean => true,
				},
			};

			this.selectedClass.className['en'] = this.classNameField.getValue;
			this.selectedClass.expCurve = this.classExperienceCurveField.getValue as string;

			event.newData = this.selectedClass;
			this.onEditConfirm(event,true);
		}
	}

	protected override onDataReceived(tableData: Table)
	{
		// Filter is being reset, that is why this function exist.
		super.onDataReceived(tableData);

		if(
			tableData.hasOwnProperty('data') && Object.values(tableData.data).length !== 0
		) {
			this.getSource.setFilter([
				// fields we want to include in the search
				{
					field: 'characterId',
					search: this.selectedClass !== null ? this.selectedClass.id.toString() : 'NaN',
				},
			], false);
		}
	}

	protected override validate()
	{
		super.validate();

		this.classNameField.setDisabledState(this.selectedClass === null);
		this.classExperienceCurveField.setDisabledState(this.selectedClass === null);
	}

	protected loadTable(value: Table)
	{
		if(value === null) return;

		if(value.metadata.title.toLowerCase() === 'parametercurves')
		{
			// store the dialogues.
			this.parameterCurves = <Table<IParameterCurve>>value;

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.parameterCurves, ['child_added']),
			);

			const newItemSettings = this.processTableData(
				this.parameterCurves, true, this.parameterCurvesSettings,
			);
			this.parameterCurvesSettings = Object.assign({}, newItemSettings);
		}

		if(value.metadata.title.toLowerCase() === 'skills')
		{
			// store the dialogues.
			this.skills = <Table<ISkill>>value;

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.skills, ['child_added']),
			);

			this.skillsSettings.actions.add = true;
			const newItemSettings = this.processTableData(
				this.skills, true, this.skillsSettings,
			);
			this.skillsSettings = Object.assign({}, newItemSettings);
		}
	}

	protected configureStats()
	{
		const maxXAxis: string[] = [];
		const lvEXP: number[] = [0];
		const lvDiff: number[] = [];

		const stats: LineSeriesOption[] = [];
		let prev = 0;

		this.parameterCurves.forEach((stat) =>
		{
			if(this.selectedClass.id === stat.classId)
			{
				this.classCurves.push(stat);
				this.classConfigs.push({});
				stats.push({
					name: stat.paramName,
					type: 'line',
					stack: 'Total amount',
					data: [],
				});
			}

		})

		for(let level = 1; level <= this.project.gameStats.maxLevel; level++)
		{
			let currEXP: number = level !== 1
				? UtilsService.Parser.evaluate(this.project.gameStats.formulaPlayers, { level: level })
				: 0;

			// let currEXP: number = level !== 1 ? (level - 1) * 156 + (level - 1) *(level - 1) * (level - 1) * 1.265 - 3 : 0;
			currEXP = Math.ceil(currEXP);
			// const difference: number = level !== 1 ? currEXP - lvEXP[level] : 0;
			// 5 * (1 * 2) + 100 = 105
			// 5 * (2 * 2) + 100 = 120
			lvEXP.push(currEXP);

			const difference: number = level !== 1 ? currEXP - lvEXP[level - 1] : currEXP;

			// console.log({ level: level, EXP: currEXP, lv: level - 1, diff: difference });
			lvDiff.push(difference);
			maxXAxis.push(level.toString());

			// Calculate the stats
			let index = 0;
			this.parameterCurves.forEach((stat) =>
			{
				if(this.selectedClass.id === stat.classId)
				{
					// set the name of the stat obj

					let calculateGrowth = stat.flat;

					const parseValue = (value: string | number, extras?: any) => {
						if (typeof value === 'number')
							return value;

						if (value.includes('prev') && extras.hasOwnProperty('prev')) {
							// console.log(extras.prev);
							return UtilsService.Parser.evaluate(value, { prev: extras.prev });
						}
					}

					if (this.conditionalGrowth.hasOwnProperty(stat.alias)) {
						this.conditionalGrowth[stat.alias].forEach((c) => {
							const condition = c.condition
							// if we are equal to the condition continue
							if (condition === '==' && level === c.level) {
								// console.log({ level: level, minMax: c.minMaxLevel, condLv: c.level, prev: prev, growth: calculateGrowth });
								calculateGrowth = parseValue(c.growthValue, { prev: prev });
								prev = calculateGrowth;
							}
							// if we have higher than then we need the max level var
							else if (condition === '>=' && level >= c.level && level <= c.minMaxLevel) {
								// console.log({ level: level, minMax: c.minMaxLevel, condLv: c.level, prev: prev, growth: calculateGrowth });
								calculateGrowth = parseValue(c.growthValue, { prev: prev });
								prev = calculateGrowth;
							} else if (condition === '<=' && c.level >= level && level <= c.minMaxLevel) {
								calculateGrowth = parseValue(c.growthValue, { prev: prev });
								prev = calculateGrowth;
							}
						});
					}
					// console.log(stat.formula);
					const calc = UtilsService.Parser.evaluate(stat.paramFormula,
						{ level, base: stat.base, rate: stat.rate, flat: calculateGrowth },
					);

					// console.log({name: k, level: level, stat: calc, flat: calculateGrowth })
					stats[index].data.push(calc);
					index++;
				}
			});
		}

		// Add subscription for the themeJS
		this.mainSubscription.add(this.themeService.getJsTheme().subscribe(config =>
		{
			const colors: any[] = [
				config.variables.primaryLight,
				config.variables.successLight,
				config.variables.infoLight,
				config.variables.warningLight,
				config.variables.dangerLight,
				config.variables.primary,
				config.variables.success,
				config.variables.info,
				config.variables.danger,
			];
			const echarts: any = config.variables.echarts;
			stats.forEach((stat, index, arr) =>
			{
				arr[index].areaStyle = { opacity: echarts.areaOpacity };
				this.classConfigs[index] = {
					animations: true,
					backgroundColor: echarts.bg,
						color: [colors[index]],
						tooltip: {
							trigger: 'axis',
							axisPointer: {
								type: 'cross',
								label: {
									backgroundColor: echarts.tooltipBackgroundColor,
								},
							},
						},
						legend: {
							left: 'left',
							data: Object.values(this.classCurves).filter((s, idx) => {
								return idx === index;
							}).map((s) => s.paramName),
							textStyle: {
								color: echarts.textColor,
							},
						},
						grid: {
							left: '3%',
							right: '4%',
							bottom: '3%',
							containLabel: true,
						},
						xAxis: [
							{
								type: 'category',
								boundaryGap: false,
								data: maxXAxis,
								axisTick: {
									alignWithLabel: true,
								},
								axisLine: {
									lineStyle: {
										color: echarts.axisLineColor,
									},
								},
								axisLabel: {
									color: echarts.textColor,
								},
							},
						],
						yAxis: [
							{
								type: 'value',
								axisLine: {
									lineStyle: {
										color: echarts.axisLineColor,
									},
								},
								splitLine: {
									lineStyle: {
										color: echarts.splitLineColor,
									},
								},
								axisLabel: {
									color: echarts.textColor,
								},
							},
						],
						series: [ arr[index] ],
					};
				});

			const series: LineSeriesOption[] = [
				{
					name: 'Amount of EXP per level',
					type: 'line',
					data: lvEXP,
					stack: 'total amount',
					areaStyle: { opacity: echarts.areaOpacity },
					smooth: true,
				},
				{
					name: 'EXP needed',
					type: 'line',
					data: lvDiff,
					stack: 'total amount',
					areaStyle: { opacity: echarts.areaOpacity },
					smooth: true,
				},
			];

			this.eCharLevelOptions = {
				backgroundColor: echarts.bg,
				color: [colors[0], colors[1]],
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'cross',
						label: {
							backgroundColor: echarts.tooltipBackgroundColor,
						},
					},
				},
				legend: {
					left: 'left',
					textStyle: {
						color: echarts.textColor,
					},
					data: ['Amount of EXP per level', 'EXP needed'].reverse(),
				},
				grid: {
					left: '3%',
					right: '4%',
					bottom: '3%',
					containLabel: true,
				},
				xAxis: [
					{
						type: 'category',
						boundaryGap: false,
						data: maxXAxis,
						axisTick: {
							alignWithLabel: true,
						},
						axisLine: {
							lineStyle: {
								color: echarts.axisLineColor,
							},
						},
						axisLabel: {
							color: echarts.textColor,
						},
					},
				],
				yAxis: [
					{
						type: 'value',
						axisLine: {
							lineStyle: {
								color: echarts.axisLineColor,
							},
						},
						splitLine: {
							lineStyle: {
								color: echarts.splitLineColor,
							},
						},
						axisLabel: {
							color: echarts.textColor,
						},
					},
				],
				series: series.reverse(),
			};
			/*
			this.eCharLevelOptions = {
				backgroundColor: echarts.bg,
				color: [colors.danger, colors.primary, colors.info],
				trigger: 'axis',
				axisPointer: {
					type: 'cross',
					label: {
						backgroundColor: echarts.tooltipBackgroundColor,
					},
				},
				legend: {
					left: 'left',
					data: ['Amount of EXP per level', 'EXP needed'],
					textStyle: {
						color: echarts.textColor,
					},
				},
				xAxis: [
					{
						type: 'category',
						data: maxXAxis,
						axisTick: {
							alignWithLabel: true,
						},
						axisLine: {
							lineStyle: {
								color: echarts.axisLineColor,
							},
						},
						axisLabel: {
							// interval: 2,
							textStyle: {
								color: echarts.textColor,
							},
						},
					},
				],
				yAxis: [
					{
						type: 'value',
						axisLine: {
							lineStyle: {
								color: echarts.axisLineColor,
							},
						},
						splitLine: {
							lineStyle: {
								color: echarts.splitLineColor,
							},
						},
						axisLabel: {
							textStyle: {
								color: echarts.textColor,
							},
						},
					},
				],
				grid: {
					left: '0%',
					right: '1%',
					bottom: '1%',
					containLabel: true,
				},
				series: [
					{
						name: 'Amount of EXP per level',
						type: 'line',
						data: lvEXP,
						smooth: true,
					},
					{
						name: 'EXP needed',
						type: 'line',
						data: lvDiff,
						smooth: true,
					},
				],
			};
			*/
		}));
	}
}
