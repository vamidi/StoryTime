import { Pipe, PipeTransform } from '@angular/core';
import { TablesService } from '@app-core/data/tables.service';
import { ProjectService } from '@app-core/data/projects.service';

declare type sortOrder = 'asc' | 'desc';

@Pipe({
	name: 'orderBy',
	pure: false,
})
export class OrderByPipe implements PipeTransform
{
	transform<T>(value: Iterable<T>, sortBy: sortOrder, propertyName: string): Array<T>;
	transform<T>(value: null|undefined, sortBy: sortOrder, propertyName: string): null;
	transform<T>(value: Iterable<T>|null|undefined, sortBy: sortOrder, propertyName: string): Array<T>|null;
	transform<T>(value: Iterable<T>|null|undefined, sortBy: sortOrder = 'asc', propertyName: string): Array<T>|null
	{
		if (value == null) return null;

		const arrValue: T[] = Array.from(value);

		if (propertyName)
		{
			const isMetadata = value instanceof TablesService || value instanceof ProjectService;

			// if we have a dot in the text that we might have nested values.
			return arrValue.sort((a, b) => this.sort(propertyName, sortBy, a, b, isMetadata));
		}else
			return arrValue;
	}

	protected sort(propertyName: string, sortDirection: sortOrder, a: any, b: any, isMetadata: boolean)
	{
		if(sortDirection === 'desc')
			return isMetadata ?
				b.metadata[propertyName].localeCompare(a.metadata[propertyName]) :
				b[propertyName].localeCompare(a[propertyName]);
		else
			return isMetadata ?
				a.metadata[propertyName].localeCompare(b.metadata[propertyName]) :
				a[propertyName].localeCompare(b[propertyName]);
	}
}
