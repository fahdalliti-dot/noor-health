import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class RequestIdPipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata) {
    return value;
  }
}