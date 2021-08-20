import { NgModule } from '@angular/core';
import { EchartsLineComponent, EchartsRadarComponent } from './index';
import { EchartsPieComponent } from './echarts-pie.component';
import { EchartsBarComponent } from './bar/echarts-bar.component';
import { EchartsMultipleXaxisComponent } from './echarts-multiple-xaxis.component';
import { EchartsAreaStackComponent } from './area-stack/echarts-area-stack.component';
import { EchartsBarAnimationComponent } from './echarts-bar-animation.component';
import { ThemeModule } from '@app-theme/theme.module';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ChartModule } from 'angular2-chartjs';
import { NbCardModule } from '@nebular/theme';

const components = [
	EchartsLineComponent,
	EchartsPieComponent,
	EchartsBarComponent,
	EchartsMultipleXaxisComponent,
	EchartsAreaStackComponent,
	EchartsBarAnimationComponent,
	EchartsRadarComponent,
];

@NgModule({
	imports:[
		ThemeModule,
		NgxEchartsModule.forRoot({
			/**
			 * This will import all modules from echarts.
			 * If you only need custom modules,
			 * please refer to [Custom Build] section.
			 */
			echarts: () => import('echarts'), // or import('./path-to-my-custom-echarts')
		}),
		NgxChartsModule,
		ChartModule,
		NbCardModule,
		ThemeModule,
		ChartModule,
		NbCardModule,
	],
	declarations: [
		...components,
	],
	exports: [
		EchartsRadarComponent,
		EchartsAreaStackComponent,
		EchartsLineComponent,
	],
})
export class EchartsModule {

}
