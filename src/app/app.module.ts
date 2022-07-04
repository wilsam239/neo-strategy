import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';


import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import Konva from 'konva';

const MATERIAL_LIBS = [
    MatCardModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule
    
]

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    ...MATERIAL_LIBS,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
