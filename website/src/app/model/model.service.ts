import { Injectable } from '@angular/core';
import { Paper } from './paper.model';
import { Author } from './author.model';
import { TopicNoImg, Topic } from './topic.model';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * This service describes and contains the **model** of the application
 */
@Injectable({
  providedIn: 'root'
})
export class ModelService {
  /**
   * Model data
   */
  private _allTopicsInGraph: TopicNoImg[]; // list of all the topics in the graph, retrieved from the api

  private _retrievedPapers: Paper[] = [];
  private _retrievedAuthors: Author[] = [];

  private _searchTopic: TopicNoImg; // search keyword inserted by the user
  private _prevSearchTopic: TopicNoImg; // the previously search key inserted by the user
  private _canSearch: boolean; // status flag: true if the user can perform a search
  private _firstSearch: boolean;
  private _searchCount = 0;

  /**
   * constructor
   */
  constructor(private http: HttpClient) {
    this._searchTopic = new TopicNoImg('', '', '');
    this.getAllTopics().subscribe();
  }

  /**
   * getters and setters
   */
  set searchTopic(searchTopic: TopicNoImg) {
    if (searchTopic !== this._prevSearchTopic) {
      this.emptyPrevResults();
      this._prevSearchTopic = this._searchTopic;
      this._searchTopic = searchTopic;
      this._searchCount++;
      if (this._searchCount > 1) {
        this._firstSearch = false;
      }
    }
  }

  get searchTopic(): TopicNoImg {
    return this._searchTopic;
  }

  getAllTopics() {
    const url =
      'http://api.geranium.nexacenter.org/api?' +
      encodeURI(`type=topics&lines=100000&offset=0`);
    return this.http.get<{ url: string; label: string }[]>(url).pipe(
      tap(result => {
        this._allTopicsInGraph = [];
        for (const topic of result) {
          this._allTopicsInGraph.push(
            new TopicNoImg(topic.url, this.getWikiUrl(topic.url), topic.label)
          );
        }
        this.canSearch = true;
      })
    );
  }

  searchTopicFromString(topicString: string) {
    if (this.allTopicsInGraph === undefined) {
      return this.getAllTopics().pipe(
        tap(r => {
          const topic = this.allTopicsInGraph.find(
            s => s.label === topicString
          );
          this.searchTopic = topic;
        })
      );
    }
    const topic = this.allTopicsInGraph.find(s => s.label === topicString);
    this.searchTopic = topic;

    // Fake observable to subscribe to
    return new Observable<TopicNoImg[]>(t => {
      t.next();
      t.complete();
    });
  }

  searchTopicToString(): string {
    return this.searchTopic.label;
  }

  getWikiUrl(url: string): string {
    const parts = url.split('/');
    return 'en.wikipedia.org/wiki/' + parts[parts.length - 1];
  }

  get prevSearchTopic(): TopicNoImg {
    return this._prevSearchTopic;
  }

  set allTopicsInGraph(topics: TopicNoImg[]) {
    this._allTopicsInGraph = topics;
  }

  get allTopicsInGraph(): TopicNoImg[] {
    return this._allTopicsInGraph;
  }

  set canSearch(isSearchEnabled: boolean) {
    this._canSearch = isSearchEnabled;
  }

  get canSearch(): boolean {
    return this._canSearch;
  }

  get firstSearch(): boolean {
    return this._firstSearch;
  }

  addPaper(newPaper: Paper) {
    this._retrievedPapers.push(newPaper);
  }

  addAllPapers(newPapers: Paper[]) {
    this._retrievedPapers = this._retrievedPapers.concat(newPapers);
  }

  findPaperFromId(id: string): Paper {
    return this._retrievedPapers.find(p => p.id === id);
  }

  getPapersCount(): number {
    return this._retrievedPapers.length;
  }

  getRetrievedPapers(): Paper[] {
    return [...this._retrievedPapers];
  }

  addAuthor(newAuthor: Author) {
    this._retrievedAuthors.push(newAuthor);
  }

  addAllAuthors(newAuthors: Author[]) {
    this._retrievedAuthors = this._retrievedAuthors.concat(newAuthors);
  }

  findAuthorFromId(id: string): Author {
    return this._retrievedAuthors.find(a => a.id === id);
  }

  getRetrievedAuthors(): Author[] {
    return [...this._retrievedAuthors];
  }

  emptyAuthors() {
    this._retrievedAuthors = [];
  }

  emptyPrevResults() {
    this.emptyAuthors();
    this._retrievedPapers = [];
  }

  simplifyAuthorName(name: string): string {
    let builder = '';
    let i: number;
    const names = name.split(' ');
    for (i = 0; i < names.length - 1; i++) {
      builder += names[i].charAt(0).toUpperCase() + '. ';
    }
    let first = names[i].toLowerCase();
    first = first.charAt(0).toUpperCase() + first.slice(1);
    builder += first;
    return builder;
  }
}
