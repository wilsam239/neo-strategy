import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';

import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SettingsComponent } from './settings/settings.component';
import { ThemeService } from './theme.service';

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
  MatExpansionModule,
  MatTooltipModule,
  MatSlideToggleModule,
  MatSelectModule,
  MatMenuModule,
];

@NgModule({
  declarations: [AppComponent, SettingsComponent],
  imports: [BrowserModule, BrowserAnimationsModule, FlexLayoutModule, FormsModule, ...MATERIAL_LIBS],
  providers: [ThemeService],
  bootstrap: [AppComponent],
})
export class AppModule {}
