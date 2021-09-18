import { Component, Inject, OnInit } from '@angular/core';
import { BaseTabComponent } from './base-tab.component';
import { ProxyObject } from '@app-core/data/base';
import { BaseSettings, ISettings } from '@app-core/mock/base-settings';
import { Table, TablesService } from '@app-core/data/state/tables';
import { IClassParameterCurve, IEnemyParameterCurve } from '@app-core/data/database/interfaces';
import { EChartsOption } from 'echarts';
import { NbMenuItem } from '@nebular/theme/components/menu/menu.service';
import { InsertMultipleDialogComponent } from '@app-theme/components/firebase-table';
import { BehaviorSubject } from 'rxjs';
import { BehaviourType } from '@app-core/types';
import { LineSeriesOption } from 'echarts/types/src/chart/line/LineSeries';
import { UtilsService } from '@app-core/utils';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { UserService } from '@app-core/data/state/users';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { NbDialogService, NbThemeService, NbToastrService } from '@nebular/theme';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';

@Component({ template: '' })
export abstract class BaseStatTabComponent<T extends ProxyObject> extends BaseTabComponent<T>
{
	public eCharLevelOptions: EChartsOption = null;

	public curves: (IClassParameterCurve | IEnemyParameterCurve)[] = [];
	public eChartsOptions: EChartsOption[] = [];

	public constructor(
		protected route: ActivatedRoute,
		protected firebaseService: FirebaseService,
		protected userService: UserService,
		protected projectsService: ProjectsService,

		protected router: Router,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected dialogService: NbDialogService,
		protected userPreferencesService: UserPreferencesService,
		protected tableService: TablesService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		protected themeService: NbThemeService,
		@Inject(String)protected tableId = '',
	) {
		super(route, firebaseService, userService, projectsService, router, toastrService, snackbarService, dialogService,
			userPreferencesService, tableService, firebaseRelationService, languageService, tableId);
	}
}

@Component({ template: '' })
export abstract class BaseParameterTabComponent<T extends ProxyObject> extends BaseStatTabComponent<T> implements OnInit
{
	protected parameterCurvesSettings: ISettings = new BaseSettings();
	protected parameterCurves: Table<IClassParameterCurve | IEnemyParameterCurve> = null;

	public cardOptions: Map<number | string, NbMenuItem[]> = new Map<number | string, NbMenuItem[]>();

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
	{ [key: string]: { condition: string, level: number, minMaxLevel?: number, growthValue: string | number }[] } =
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
	};

	protected includedTables: string[] = ['parametercurves'];

	public ngOnInit()
	{
		super.ngOnInit();

		this.mainSubscription.add(this.project$.subscribe((project: Project) =>
		{
			if(project)
			{
				this.tableService.loadTablesFromProject(project, this.includedTables, (table) => this.loadTable(table))
					.then();

				// Important or data will not be caught.
				this.getTableData(this.settings);
			}
		}));
	}

	public onActiveSelection(event: number) {
		super.onActiveSelection(event);
		this.curves = [];
		this.eChartsOptions = [];
	}

	public insertStat(optionalData: any)
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent,{
			context: {
				title: 'Add a new stat',
				tblName: 'parameterCurves',
				settings: this.parameterCurvesSettings,
				data: optionalData,
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
		const paramCurve = { ...this.parameterCurves.find(data.id) } as IClassParameterCurve;
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

	protected loadTable(value: Table)
	{
		if (value === null) return;

		if (value.metadata.title.toLowerCase() === 'parametercurves')
		{
			// store the dialogues.
			this.parameterCurves = <Table<IClassParameterCurve | IEnemyParameterCurve>>value;

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.parameterCurves, ['child_added']),
			);

			const newItemSettings = this.processTableData(
				this.parameterCurves, true, this.parameterCurvesSettings,
			);
			this.parameterCurvesSettings = Object.assign({}, newItemSettings);
		}
	}

	protected abstract validateStat(stat: IClassParameterCurve | IEnemyParameterCurve): boolean;

	protected configureStats()
	{
		const maxXAxis: string[] = [];
		const lvEXP: number[] = [0];
		const lvDiff: number[] = [];

		const stats: LineSeriesOption[] = [];
		let prev = 0;

		this.parameterCurves.forEach((stat) =>
		{
			const insert = () => {
				this.curves.push(stat);
				this.eChartsOptions.push({});
				stats.push({
					name: this.languageService.getLanguageFromProperty(stat.paramName, this.selectedLanguage),
					type: 'line',
					stack: 'Total amount',
					data: [],
				});
			}

			if(this.validateStat(stat))
				insert();

			// TODO
			// else if(stat.enemyCategoryId !== Number.MAX_SAFE_INTEGER)
			// {
			// 	if(stat.enemyCategoryId === this.selectedObject.id)
			// 		insert();
			// }
		});

		if(stats.length > 0)
		{
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
					if(this.validateStat(stat))
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
				this.eChartsOptions[index] = {
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
						data: Object.values(this.curves).filter((s, idx) => {
							return idx === index;
						}).map((s) => this.languageService.getLanguageFromProperty(s.paramName, this.selectedLanguage)),
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
