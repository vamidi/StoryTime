import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NodeComponent, NodeService } from 'visualne-angular-plugin';

@Component({
	templateUrl: './node.component.html',
	styleUrls: ['./node.component.sass'],
	providers:[NodeService],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyNodeComponent extends NodeComponent implements OnInit
{
	public editMode: boolean = false;

	constructor(
		protected service: NodeService,
		protected cd: ChangeDetectorRef)
	{
		super(service, cd);
	}

	public ngOnInit(): void
	{
		super.ngOnInit();
	}
}
