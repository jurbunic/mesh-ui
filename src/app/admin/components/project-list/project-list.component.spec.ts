import { async, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { Component, Input, state } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';

import { Button, GenticsUICoreModule, ModalService } from 'gentics-ui-core';
import { TestApplicationState } from '../../../state/testing/test-application-state.mock';
import { ProjectListComponent } from './project-list.component';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { componentTest } from '../../../../testing/component-test';
import { CreateProjectModalComponent } from '../create-project-modal/create-project-modal.component';
import { SharedModule } from '../../../shared/shared.module';
import { CoreModule } from '../../../core/core.module';
import { mockProject } from '../../../../testing/mock-models';
import { TestStateModule } from '../../../state/testing/test-state.module';
import { AdminProjectEffectsService } from '../../providers/effects/admin-project-effects.service';
import { MockModalService } from '../../../../testing/modal.service.mock';
import { MockAdminListComponent } from '../admin-list/admin-list.component.mock';

import { MockActivatedRoute } from '../../../../testing/router-testing-mocks';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminListComponent } from '../admin-list/admin-list.component';
import { MockAdminListItem } from '../admin-list-item/admin-list-item.component.mock';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdminListItemComponent } from '../admin-list-item/admin-list-item.component';

describe('ProjectListComponent', () => {

    let appState: TestApplicationState;
    let mockModalService: MockModalService;

    beforeEach(async(() => {

        TestBed.configureTestingModule({
            declarations: [
                ProjectListComponent,
                AdminListComponent,
                MockAdminListItem,
                CreateProjectModalComponent,
            ],
            imports: [
                GenticsUICoreModule,
                FormsModule,
                SharedModule,
                CoreModule,
                TestStateModule,
                BrowserAnimationsModule,
                RouterTestingModule
            ],
            providers: [
                { provide: ModalService, useClass: MockModalService },
                { provide: ActivatedRoute, useClass: MockActivatedRoute },
                { provide: AdminProjectEffectsService, useValue: jasmine.createSpyObj('stub', ['loadProjects', 'deleteProject'])}
            ]
        });
    }));

    beforeEach(() => {
        appState = TestBed.get(ApplicationStateService);
        appState.trackAllActionCalls({ behavior: 'original' });
        appState.mockState({
            adminProjects: {
                projectList: ['55f6a4666eb8467ab6a4666eb8867a84', 'b5eba09ef1554337aba09ef155d337a5'],
                filterTerm: '',
            },
            auth: {
                currentUser: 'd8b043e818144e27b043e81814ae2713'
            }, entities: {
                project: {
                    '55f6a4666eb8467ab6a4666eb8867a84': mockProject({
                        uuid: '55f6a4666eb8467ab6a4666eb8867a84',
                        name: 'demo',
                        rootNode: {
                            projectName: 'demo',
                            uuid: '83ff6b33bbda4048bf6b33bbdaa04840',
                            schema: {
                                name: 'folder',
                                uuid: 'b73bbc9adae94c88bbbc9adae99c88f5',
                                version: '1.0'
                            }
                        },
                    }),
                    'b5eba09ef1554337aba09ef155d337a5': mockProject({
                        uuid: 'b5eba09ef1554337aba09ef155d337a5',
                        name: 'tvc',
                        rootNode: {
                            projectName: 'demo',
                            uuid: '83ff6b33bbda4048bf6b33bbdaa04840',
                            schema: {
                                name: 'folder',
                                uuid: 'b73bbc9adae94c88bbbc9adae99c88f5',
                                version: '1.0'
                            }
                        },
                    })
                }
            }
        });

        mockModalService = TestBed.get(ModalService);
    });

    it(`fetches the list of projects`,
        componentTest(() => ProjectListComponent, fixture => {
            fixture.detectChanges();
            fixture.componentInstance.projects$.subscribe(result => {
                expect(result.length).toBe(appState.now.adminProjects.projectList.length);
            });
        })
    );

    it(`opens create project dialog when create button is clicked`,
        componentTest(() => ProjectListComponent, fixture => {
            spyOn(fixture.componentInstance.router, 'navigate').and.returnValue(true);
            fixture.debugElement.query(By.directive(Button)).nativeElement.click();
            tick();
            fixture.detectChanges();

            expect(mockModalService.fromComponentSpy).toHaveBeenCalled();
            mockModalService.confirmLastModal(mockProject({uuid: '__NEW_PROJECT_UUID__'}));

            expect(fixture.componentInstance.router.navigate).toHaveBeenCalledWith(['/admin/projects', '__NEW_PROJECT_UUID__']);
        })
    );

    it(`deletes a project when delete project is clicked`,
        componentTest(() => ProjectListComponent, fixture => {

            tick();
            fixture.detectChanges();

            fixture.componentInstance.projects$
                .take(1)
                .subscribe(result => {
                    fixture.componentInstance.deleteProject(result[0]);

                    tick();
                    fixture.detectChanges();

                    expect(mockModalService.dialogSpy).toHaveBeenCalled();
                    mockModalService.confirmLastModal();
                    expect(fixture.componentInstance.adminProjectEffects.deleteProject).toHaveBeenCalledWith(result[0].uuid);
                });
        })
    );

    it(`filters the projects`,
        componentTest(() => ProjectListComponent, fixture => {

            tick();
            fixture.detectChanges();

            fixture.componentInstance.projects$
                .take(1)
                .subscribe(result => {
                    const itemsBefore = fixture.debugElement.queryAll(By.css('mesh-admin-list-item'));
                    appState.actions.adminProjects.setFilterTerm('tvc');

                    tick();
                    fixture.detectChanges();

                    const items = fixture.debugElement.queryAll(By.css('mesh-admin-list-item'));
                    expect(items.length).not.toBe(itemsBefore.length);
                });
        })
    );
});
