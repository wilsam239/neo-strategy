import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';

import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const MATERIAL_LIBS = [
  MatCardModule,
  MatDialogModule,
  MatFormFieldModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatSidenavModule,
  MatListModule,
  MatSliderModule,
  MatSnackBarModule,
];

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, FlexLayoutModule, FormsModule, ...MATERIAL_LIBS],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
