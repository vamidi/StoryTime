import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AngularFireAction } from '@angular/fire/database';
import { NbThemeService } from '@nebular/theme';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Project, ProjectsService } from '@app-core/data/state/projects';
import { UserService } from '@app-core/data/state/users';
import { TablesService } from '@app-core/data/state/tables';
import { BackendService } from '@app-core/utils/backend/backend.service';
import { UtilsService } from '@app-core/utils';
import { EchartsConfig } from '@app-core/components/echarts';
import { ProxyObject } from '@app-core/data/base';
import * as _ from 'lodash';

@Component({
	selector: 'ngx-character',
	templateUrl: 'character.component.html',
})
export class CharacterComponent implements OnInit
{
	public eCharLevelOptions: EchartsConfig = {}

	public eCharStats: EchartsConfig = {};

	public charData: ProxyObject = null;

	protected mainSubscription: Subscription = new Subscription();

	protected project: Project = new Project();

	/**
	 * @typedef {[key:string]: { formula: string, base: number, rate: number, flat: number } }
	 * @protected
	 */
	protected stats: {[key:string]: { name: string, formula: string, base: number, rate: number, flat: number } } = {
		// Health Points or HP - represents the amount of damage a character can take before dying or being knocked out.
		// Magic Points or MP -
		// represents the amount of magical power a character has. Higher the power, the more spells can be cast.
		TP: {
			name: 'Technical Points',
			formula: 'base + (level * level * 6 / 105) + level * 12 * (rate - flat)',
			base: 65,
			rate: 0.12,
			flat: 0,
		},
		HP: {
			name: 'Health Points',
			formula: 'level * base + level * level * level * rate',
			base: 540,
			rate: 0.1109999,
			flat: 0,
		},
		ATK: {
			name: 'Strength',
			formula: 'level * base + level * level * level * rate',
			base: 160,
			rate: 0.1149999,
			flat: 0,
		},
		DEF: {
			name: 'Defense',
			formula: 'level * base + level * level * level * rate',
			base: 140,
			rate: 0.1129999,
			flat: 0,
		},
		// Speed -
		// represents how fast the character moves. Determines frequency of attacks and chance to dodge incoming attacks.
		// AGI: {},
		// Intelligence -
		// represents how clever the character is. Determines power of spells and ability to resist magic attacks.
		// INT: {},
	}

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

	protected modifiers: { [key: string]: any } = {

	};

	/**
	*/
	constructor(
		public tablesService: TablesService,
		protected userService: UserService,
		protected projectsService: ProjectsService,
		protected firebaseService: BackendService,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		private themeService: NbThemeService,
	)
	{
	}

	public ngOnInit(): void
	{
		const map: ParamMap = this.activatedRoute.snapshot.paramMap;
		const tableID = map.get('id');
		const id = map.get('charId');
		const projectID = this.activatedRoute.parent.snapshot.paramMap.get('id');

		// Important or data will not be cached
		this.firebaseService.getRef(`tables/${tableID}/data/${id}`).on('value', (snapshot) => {
			if(snapshot.exists())
			{
				this.charData = snapshot.val();
			}
		});

		this.mainSubscription.add(this.userService.getUser().pipe(
			switchMap(() =>
				this.projectsService.getProject() ?
				this.projectsService.getProject$() :
				this.firebaseService.getItem(projectID, `projects`).snapshotChanges(),
			),
		).subscribe((snapshot: Project | AngularFireAction<any>) =>
		{
			console.log(snapshot, typeof snapshot, snapshot instanceof Project);
			let project = null;
			if(!snapshot.hasOwnProperty('payload') || snapshot instanceof Project)
			{
				project = snapshot;
			} else if(snapshot.payload.exists())
			{
				project = snapshot.payload.val()
			}

			if (project && !_.isEqual(this.project, project) && project.hasOwnProperty('tables'))
			{
				this.project = { ...project };
				this.configureStats();
			}

			this.userService.setUserPermissions(this.projectsService);
		}));
	}

	protected configureStats()
	{
		const maxXAxis: string[] = [];
		const lvEXP: number[] = [0];
		const lvDiff: number[] = [];
		const stats: { name: string, type: string, stack: string, areaStyle?: {}, data: any[] }[] = [];
		let prev = 0;

		Object.keys(this.stats).forEach((k) =>
		{
			const stat: { name: string } = this.stats[k];
			stats.push({
				name: stat.name,
				type: 'line',
				stack: 'Total amount',
				data: [],
			});
		});

		console.log(this.project.gameStats.maxLevel);
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
			Object.keys(this.stats).forEach((k, index) =>
			{
				const stat: { name: string, formula: string, base: number, rate: number, flat: number } = this.stats[k];

				// set the name of the stat obj

				let calculateGrowth = stat.flat;

				const parseValue = (value: string | number, extras?: any) =>
				{
					if(typeof value === 'number')
						return value;

					if(value.includes('prev') && extras.hasOwnProperty('prev'))
					{
						// console.log(extras.prev);
						return UtilsService.Parser.evaluate(value, { prev: extras.prev });
					}
				}

				if(this.conditionalGrowth.hasOwnProperty(k))
				{
					this.conditionalGrowth[k].forEach((c) =>
					{
						const condition = c.condition
						// if we are equal to the condition continue
						if (condition === '==' && level === c.level)
						{
							// console.log({ level: level, minMax: c.minMaxLevel, condLv: c.level, prev: prev, growth: calculateGrowth });
							calculateGrowth = parseValue(c.growthValue, {prev: prev});
							prev = calculateGrowth;
						}
						// if we have higher than then we need the max level var
						else if (condition === '>=' && level >= c.level && level <= c.minMaxLevel)
						{
							// console.log({ level: level, minMax: c.minMaxLevel, condLv: c.level, prev: prev, growth: calculateGrowth });
							calculateGrowth = parseValue(c.growthValue, {prev: prev});
							prev = calculateGrowth;
						} else if (condition === '<=' && c.level >= level && level <= c.minMaxLevel)
						{
							calculateGrowth = parseValue(c.growthValue, {prev: prev});
							prev = calculateGrowth;
						}
					});
				}
				// console.log(stat.formula);
				const calc = UtilsService.Parser.evaluate(stat.formula,
					{ level, base: stat.base, rate: stat.rate, flat: calculateGrowth },
				);

				// console.log({name: k, level: level, stat: calc, flat: calculateGrowth })
				stats[index].data.push(calc);
			});
		}

		// Add subscription for the themeJS
		this.mainSubscription.add(this.themeService.getJsTheme().subscribe(config =>
		{
			const colors: any = config.variables;
			const echarts: any = config.variables.echarts;

			stats.forEach((stat, index, arr) => arr[index].areaStyle = { normal: { opacity: echarts.areaOpacity } } );

			this.eCharStats = {
				backgroundColor: echarts.bg,
				color: [colors.warningLight, colors.infoLight, colors.dangerLight, colors.successLight, colors.primaryLight],
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
					data: Object.values(this.stats).map((stat) => stat.name),
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
				series: stats,
			};
			this.eCharLevelOptions = {
				backgroundColor: echarts.bg,
				color: [colors.warningLight, colors.infoLight, colors.dangerLight, colors.successLight, colors.primaryLight],
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
				series: [
					{
						name: 'Amount of EXP per level',
						type: 'line',
						stack: 'total amount',
						data: lvEXP,
						areaStyle: { normal: { opacity: echarts.areaOpacity } },
						smooth: true,
					},
					{
						name: 'EXP needed',
						type: 'line',
						data: lvDiff,
						stack: 'total amount',
						areaStyle: { normal: { opacity: echarts.areaOpacity } },
						smooth: true,
					},
				].reverse(),
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
