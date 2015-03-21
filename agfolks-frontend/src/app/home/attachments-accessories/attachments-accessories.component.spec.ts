import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachmentsAccessoriesComponent } from './attachments-accessories.component';

describe('AttachmentsAccessoriesComponent', () => {
  let component: AttachmentsAccessoriesComponent;
  let fixture: ComponentFixture<AttachmentsAccessoriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttachmentsAccessoriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachmentsAccessoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
