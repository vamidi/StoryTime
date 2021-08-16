import { Component, Input } from '@angular/core';
import { EchartsConfig } from '@app-core/components/echarts/echarts.config';

@Component({
	selector: 'ngx-echarts-radar',
	template: `
		<div echarts [options]="options" class="echart"></div>
	`,
})
export class EchartsRadarComponent
{
	@Input()
	options: EchartsConfig = {};
}
