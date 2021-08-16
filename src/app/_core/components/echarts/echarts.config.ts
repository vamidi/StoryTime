export interface EchartsConfig
{
	backgroundColor?: any,
	color?: any[],
	tooltip?: {},
	trigger?: string,
	axisPointer?: {
		type: string,
		label: {},
	},
	legend?: {
		left?: string,
		data: string[],
		textStyle: {
			color: string,
		},
	},
	grid?: {
		left: string,
		right: string,
		bottom: string,
		containLabel: boolean,
	},
	radar?: {
		name: {
			textStyle: {},
		},
		indicator: { name: string, max: number }[],
		splitArea: {
			areaStyle: {
				color: string,
			},
		},
	},
	xAxis?: {
		type: string, boundaryGap?: boolean, data: any[], axisTick: { alignWithLabel: boolean },
		axisLine: { lineStyle: {} }, axisLabel: {} }[],
	yAxis?: {
		type: string, axisLine: {}, splitLine: {}, axisLabel: {} }[],
	series?: {
		name: string,
		stack?: string,
		type: string,
		barWidth?: string,
		areaStyle?: {},
		label?: {},
		smooth?: boolean,
		data: number[] | { value: number[], name: string }[],
	}[],
}
