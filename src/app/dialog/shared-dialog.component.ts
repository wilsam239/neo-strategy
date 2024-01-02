import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'shared-dialog',
  templateUrl: './shared-dialog.component.html',
  styleUrls: ['./shared-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SharedDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      text?: string;
      posBtn?: string;
      negBtn?: string;
    },
    private cdr: ChangeDetectorRef
  ) {}

  onClick(res?: any): void {
    this.dialogRef.close(res);
  }
}
