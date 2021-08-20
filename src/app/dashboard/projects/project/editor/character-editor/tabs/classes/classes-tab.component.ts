import { Component, OnInit, ViewChild } from '@angular/core';
import { EChartsOption } from 'echarts';
import { LineSeriesOption } from 'echarts/types/src/chart/line/LineSeries';
import { BaseTabComponent } from '@app-dashboard/projects/project/editor/character-editor/tabs/Base/base-tab.component';
import { UtilsService } from '@app-core/utils';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { NbDialogService, NbThemeService, NbToastrService } from '@nebular/theme';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { UserService } from '@app-core/data/state/users';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { IParameterCurve } from '@app-core/data/standard-tables';

import { DynamicFormComponent, TextFieldComponent } from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';

@Component({
	selector: 'ngx-classes-tab',
	templateUrl: 'classes-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class ClassesTabComponent extends BaseTabComponent implements OnInit
{
	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('characterNameField', { static: true})
	public characterNameField: TextFieldComponent = null;

	@ViewChild('characterExperienceCurveField', { static: true})
	public characterExperienceCurveField: TextFieldComponent = null;

	public source: BaseFormSettings = {
		title: 'Class Settings',
		alias: 'class-settings',
		requiredText: 'Fill in all the fields',
		fields: {},
	};

	public eCharLevelOptions: EChartsOption = null;

	public characterCurves: IParameterCurve[] = [];
	public characterConfigs: EChartsOption[] = [];

	protected parameterCurves: Table<IParameterCurve> = null;

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

		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected dialogService: NbDialogService,
		protected userPreferencesService: UserPreferencesService,
		protected tableService: TablesService,
		protected languageService: LanguageService,
	) {
		super(route, firebaseService, userService, projectsService, router, toastrService, snackbarService, dialogService,
			userPreferencesService, tableService, firebaseRelationService, languageService, '-MhYQ7zqYvJ1lD6I-aSI');
	}

	public ngOnInit()
	{
		super.ngOnInit();

		this.formComponent.showLabels = true;

		// Text box question
		this.formComponent.addInput<string>(this.characterNameField, {
			controlType: 'textbox',
			value: '',
			name: 'name',
			text: 'Name',
			placeholder: 'Name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		// Text box question
		this.formComponent.addInput<string>(this.characterExperienceCurveField, {
			controlType: 'textbox',
			value: '',
			name: 'character-exp',
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
				this.tableService.loadTablesFromProject(project, ['parametercurves'], (table) => this.loadTable(table))
					.then();

				// Important or data will not be caught.
				this.getTableData(this.settings);
				console.log(this.settings);
			}
		}));

	}

	public onCharacterClicked(event: number)
	{
		super.onCharacterClicked(event);

		this.characterCurves = [];
		this.characterConfigs = [];
		this.eCharLevelOptions = null;
		if(event !== Number.MAX_SAFE_INTEGER && this.selectedCharacter !== null)
		{
			if(event !== Number.MAX_SAFE_INTEGER)
			{
				if(this.selectedCharacter)
				{
					this.characterNameField.setValue = this.selectedCharacter.name['en'];
					this.characterExperienceCurveField.setValue = this.project.gameStats.formulaPlayers;
				}
			}

			this.configureStats();
		}
		this.getSource.setFilter([
			// fields we want to include in the search
			{
				field: 'classId',
				search: this.selectedCharacter !== null ? this.selectedCharacter.classId.toString() : 'NaN',
			},
		], false);
	}

	public onSendForm()
	{

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
					search: this.selectedCharacter !== null ? this.selectedCharacter.classId.toString() : 'NaN',
				},
			], false);
		}
	}

	protected override validateCharacter()
	{
		super.validateCharacter();

		this.characterNameField.setDisabledState(this.selectedCharacter === null);
		this.characterExperienceCurveField.setDisabledState(this.selectedCharacter === null);
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
			if(stat.classId === this.selectedCharacter.classId)
			{
				this.characterCurves.push(stat);
				this.characterConfigs.push({});
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
			this.parameterCurves.forEach((stat, index) =>
			{
				if(stat.classId === this.selectedCharacter.classId)
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
				this.characterConfigs[index] = {
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
							data: Object.values(this.characterCurves).filter((s, idx) => {
								return idx === index;
							}).map((s) => s.name),
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
