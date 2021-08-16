import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { EchartsConfig } from '@app-core/components/echarts';

@Component({
	selector: 'ngx-echarts-line',
	template: `
		<div echarts [options]="options" class="echart"></div>
	`,
})
export class EchartsLineComponent
{
	@Input()
	options: EchartsConfig = {};
}
